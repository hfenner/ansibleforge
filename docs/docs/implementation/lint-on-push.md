# CI Lint on Push

## Goal

Run `ansible-lint` against the repository automatically on every push to `main`, using Event-Driven Ansible end to end:

```text
GitHub webhook --> EDA event stream --> rulebook activation --> job template --> lint playbook
```

Every piece is declared in Git. The playbook and rulebook live in this repository, and the AAP objects that wire them together (job template, event stream, credential, activation) are config-as-code under `controller_config/`, so installing the slice means adding files and running one CaC apply.

## How it works

1. GitHub POSTs push events to the ingress URL of an EDA **event stream** named `GitHub`. The stream validates the HMAC signature using a shared secret.
2. The stream has `forward_events: true`, so validated events are forwarded to rulebook activations. The rulebook's `ansible.eda.pg_listener` source is only an attachment point — the activation maps the event stream onto `source_index: 0`, and EDA delivers stream events there.
3. Forwarded events wrap the webhook body under `event.payload`, and `event.meta.eda_event_stream_name` carries the stream name. There are no HTTP headers on the event.
4. A rule matches pushes to `main` and launches the **CI - Ansible Lint** job template, passing the pushed commit SHA as `git_ref`.
5. The job template runs `playbooks/ci/ansible_lint.yml`, which clones the repository at `git_ref`, runs `ansible-lint`, and fails the job if lint reports violations.

## Files

| File | Purpose |
|------|---------|
| `playbooks/ci/ansible_lint.yml` | Clone the repo at `git_ref` and run `ansible-lint` |
| `extensions/eda/rulebooks/ee-build-on-change.yml` | Rulebook with the push-to-main rule |
| `controller_config/env/Default/env/common/controller_job_templates.d/ci.yml` | The `CI - Ansible Lint` job template |
| `controller_config/env/Default/env/common/eda_projects.d/ansibleforge.yml` | EDA project that imports the rulebooks |
| `controller_config/env/Default/env/common/eda_event_streams.d/github.yml` | The `GitHub` event stream |
| `controller_config/env/Default/env/dev/eda_credentials.d/github_webhook.yml` | HMAC secret shared with the GitHub webhook |
| `controller_config/env/Default/env/common/eda_rulebook_activations.d/ee_build_on_change.yml` | The `GitHub Push Handler` activation |

## Step 1: the lint playbook

`playbooks/ci/ansible_lint.yml` runs on the `Localhost` inventory inside the execution environment. Two details matter:

- A plain `git clone` cannot fetch a bare commit SHA, so the playbook uses `git init` + `git fetch --depth 1 origin <ref>` + `git checkout FETCH_HEAD`, which handles branch names and SHAs alike.
- The AAP runner exports `ANSIBLE_INVENTORY_UNPARSED_FAILED=true`, which makes ansible-lint's internal syntax-check probes die with "No inventory was parsed". The lint task neutralizes it:

```yaml
    - name: Run ansible-lint
      ansible.builtin.command:
        cmd: ansible-lint
        chdir: "{{ _ws.path }}"
      environment:
        ANSIBLE_INVENTORY_UNPARSED_FAILED: "false"
        ANSIBLE_INVENTORY: /dev/null
```

The playbook captures the result with `failed_when: false`, prints the lint output, cleans up the workspace, and only then fails the job if lint failed — so the report survives even when the run is red.

## Step 2: the job template

`controller_job_templates.d/ci.yml` declares the template:

```yaml
controller_templates:
  - name: "CI - Ansible Lint"
    job_type: run
    organization: Default
    project: AnsibleForge
    playbook: playbooks/ci/ansible_lint.yml
    inventory: Localhost
    execution_environment: "EE AnsibleForge"
    ask_variables_on_launch: true
    extra_vars:
      git_ref: main
```

`ask_variables_on_launch: true` lets EDA (and you) override `git_ref` at launch time; the default of `main` makes a bare manual launch a main-branch check.

This template is deliberately the **one consumer of the unpinned canary EE** (`EE AnsibleForge`); everything else runs on the pinned EE. Because it runs on every push and ansible-lint resolves the whole collection set, an upstream collection regression surfaces here within minutes. A red run may therefore mean upstream broke, not the repo — check the same commit on the pinned EE before hunting for a bug, and do not "fix" a canary failure by moving this template to the pinned EE.

## Step 3: the rulebook

The push rule in `extensions/eda/rulebooks/ee-build-on-change.yml`:

```yaml
- name: GitHub push event handler
  hosts: all
  sources:
    - ansible.eda.pg_listener:
        dsn: "{{ EDA_PG_DSN }}"
        channels:
          - github
  rules:
    - name: Push to main — run ansible-lint
      condition: >-
        event.meta.eda_event_stream_name == "GitHub" and
        event.payload.ref == "refs/heads/main" and
        event.payload.after is defined and
        event.payload.deleted == false
      action:
        run_job_template:
          name: "CI - Ansible Lint"
          organization: Default
          job_args:
            extra_vars:
              git_ref: "{{ event.payload.after }}"
```

- The `pg_listener` source is replaced at runtime by the event stream mapped in the activation; you never provide `EDA_PG_DSN` yourself.
- `event.payload.after` is the pushed commit SHA. Guarding on `deleted == false` skips branch-deletion pushes, where `after` is the null SHA.
- EDA imports rulebooks from `extensions/eda/rulebooks/` in the project repository, and the activation references the rulebook by bare filename.

## Step 4: the event stream and webhook credential

`eda_event_streams.d/github.yml` declares HMAC-validated ingress:

```yaml
eda_event_streams:
  - name: GitHub
    organization: Default
    credential_name: GitHub Webhook Credential
    event_stream_type: "GitHub Event Stream"
    forward_events: true
    state: present
```

The credential (`eda_credentials.d/github_webhook.yml`, dev env) supplies the shared secret. The token value is get-or-created in the `eda-github-webhook` Kubernetes secret in the `aap` namespace by `dispatch.yml` pre_tasks, so every CaC apply resolves the same value — you do not invent or paste a secret anywhere.

## Step 5: the activation

`eda_rulebook_activations.d/ee_build_on_change.yml` binds it all together:

```yaml
eda_rulebook_activations:
  - name: GitHub Push Handler
    organization: Default
    project: AnsibleForge
    rulebook: ee-build-on-change.yml
    decision_environment: Default Decision Environment
    eda_credentials:
      - AAP Controller Admin
    event_streams:
      - event_stream: GitHub
        source_index: 0
    restart_policy: always
    enabled: true
```

`event_streams` maps the `GitHub` stream onto the rulebook's first source — this is what substitutes the `pg_listener` placeholder. The `AAP Controller Admin` EDA credential is what authorizes the `run_job_template` action against the controller.

## Step 6: apply the configuration

The rulebook must be merged to the branch the EDA project tracks **before** the apply — the EDA project clones from Git, so an unpushed rulebook does not exist as far as AAP is concerned.

Then run the **CaC - Apply Controller Configuration** job template (or `controller_config/dispatch.yml` manually with admin credentials). The dispatch playbook syncs the EDA project and waits for the import, so activations see current rulebooks, then creates or updates the job template, event stream, credential, and activation.

## Step 7: point the GitHub webhook at the stream

Get the ingress URL from AAP (**Automation Decisions → Event Streams → GitHub**, or `GET /api/eda/v1/event-streams/`), and the shared secret from the cluster:

```bash
oc get secret eda-github-webhook -n aap -o jsonpath='{.data.token}' | base64 -d
```

On the GitHub repository: **Settings → Webhooks → Add webhook**, with:

- **Payload URL**: the event stream ingress URL
- **Content type**: `application/json`
- **Secret**: the token above
- **Events**: "Just the push event"

GitHub sends a ping on save; the event stream page shows received events, which confirms the HMAC secret matches.

## Step 8: verify

Push any commit to `main`, then watch for the launched job:

- The `GitHub Push Handler` activation's rule audit shows the rule firing.
- A new `CI - Ansible Lint` job appears in Jobs, with `git_ref` set to the pushed SHA.

Or launch it manually against any ref without pushing:

```bash
curl -sk -u admin:$PW -X POST -H "Content-Type: application/json" \
  -d '{"extra_vars": {"git_ref": "<branch-or-sha>"}}' \
  "https://aap-aap.<cluster-domain>/api/controller/v2/job_templates/<id>/launch/"
```

A healthy run ends with lint's summary in the `Show lint output` task, e.g. `Passed: 0 failure(s), 0 warning(s) on 498 files.`

## Definition of done

- the lint playbook exists under `playbooks/ci/` and handles both branch and SHA refs
- the job template, EDA project, event stream, webhook credential, and activation are declared under `controller_config/`
- a CaC apply created all five objects and the `GitHub Push Handler` activation is running
- the GitHub webhook points at the event stream ingress URL and the ping shows up on the stream
- a push to `main` launches `CI - Ansible Lint` with `git_ref` set to the pushed commit SHA and the job goes green
