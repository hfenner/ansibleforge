# AnsibleForge

**A GitOps-driven Ansible development environment on OpenShift — batteries included.**

AnsibleForge provisions a complete Ansible development platform on OpenShift from a single ArgoCD application.
It combines purpose-built developer containers, a custom Execution Environment, and a full suite of GitOps-managed infrastructure so teams can start writing and running automation from a browser tab.

## What you get

### For developers

- A browser-based [DevSpaces](infrastructure/devspaces.md) workspace pre-loaded with every Ansible tool, cloud CLI, and IDE extension you need
- Vault secrets automatically injected into your workspace — no manual credential setup
- Persistent storage and per-user namespace isolation
- The [ansible-devspaces](containers/ansible-devspaces.md) container: Ansible dev tools, Terraform, AWS CLI, OpenShift CLI, Helm, Podman, PowerShell, Claude Code, and 30 Ansible collections

### For operators

- Everything deployed and reconciled by ArgoCD — one bootstrap Application deploys the entire stack
- [HashiCorp Vault](infrastructure/vault.md) auto-initialized, unsealed, and configured on first boot
- [External Secrets Operator](infrastructure/external-secrets.md) syncing from Vault and AWS Secrets Manager
- Per-user workspace provisioning via ArgoCD ApplicationSet — adding a user is a one-line git change
- [Shared Builds](infrastructure/shared-builds.md) keeping container images fresh in the internal registry

## Architecture

```mermaid
flowchart TB
    subgraph gitops["GitOps — ArgoCD"]
        bootstrap["Bootstrap\napp-of-apps"]
    end

    subgraph platform["Platform Services"]
        vault["🔐 HashiCorp Vault"]
        eso["🔑 External Secrets"]
        builds["🏗️ Shared Builds"]
        pipelines["⚙️ OpenShift Pipelines"]
    end

    subgraph apps["Applications"]
        devspaces["💻 DevSpaces"]
        gitlab["🦊 GitLab"]
        keycloak["🔓 Keycloak"]
        aap["⚡ AAP"]
    end

    subgraph images["Container Images"]
        devimg["ansible-devspaces\nDev Container"]
        eeimg["ee-dragonslair\nExecution Environment"]
    end

    subgraph peruser["Per-User Namespace — ApplicationSet"]
        workspace["DevWorkspace\nauto-started"]
        secrets["Secrets\nansible-config · quay-registry-secret"]
        configmap["workspace-env ConfigMap\nVAULT_ADDR"]
    end

    bootstrap --> vault
    bootstrap --> eso
    bootstrap --> builds
    bootstrap --> pipelines
    bootstrap --> devspaces
    bootstrap --> gitlab
    bootstrap --> keycloak
    bootstrap --> aap
    bootstrap -->|"one app per user"| peruser

    vault -->|"Kubernetes auth"| eso
    vault -->|"agent sidecar"| workspace
    eso -->|"sync secrets"| secrets

    builds -->|"build & publish"| devimg
    builds -->|"build & publish"| eeimg
    devimg -->|"workspace container"| workspace
    eeimg -->|"workspace container"| workspace
    eeimg -->|"job execution"| aap

    keycloak -->|"SSO"| gitlab
    devspaces -->|"manages"| workspace
```

## Repository layout

```
ansibleforge/
├── containers/
│   ├── ansible-devspaces/   # Developer container image
│   └── ee-dragonslair/      # Ansible Execution Environment
└── ocp/
    ├── bootstrap/           # ArgoCD Application manifests (app-of-apps)
    ├── vault/               # HashiCorp Vault Helm chart
    ├── external-secrets/    # ESO operator + ClusterSecretStores
    ├── shared-builds/       # BuildConfigs + ImageStreams
    ├── devspaces/           # CheCluster + DevSpaces operator
    ├── user-devspace/       # Per-user Helm chart (namespace, secrets, DevWorkspace)
    ├── user-projects/       # ApplicationSet + ArgoCD RBAC
    ├── pipelines/           # OpenShift Pipelines operator
    ├── gitlab/              # GitLab operator
    ├── keycloak/            # Keycloak operator
    └── aap/                 # Ansible Automation Platform operator
```
