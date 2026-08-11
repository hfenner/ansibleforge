# Implementation Slices

Implementation slices are small, reviewable pieces of AnsibleForge that a contributor can build without needing to understand the whole platform.

Each slice should define:

- the goal
- the files to change
- the commands to run
- a working example
- the definition of done

## Available slices

| Slice | Outcome |
|-------|---------|
| [Execution Environment BuildConfig](execution-environment-buildconfig.md) | Add a raw OpenShift BuildConfig that builds an Ansible Execution Environment with `oc apply` |
| [CI Lint on Push](lint-on-push.md) | Install the EDA rulebook, playbook, and job template that run `ansible-lint` on every push to `main` |
