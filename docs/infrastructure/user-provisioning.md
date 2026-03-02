# User Provisioning

**Charts:** `openshift/user-projects/`, `openshift/user-devspace/`

## Overview

Adding a user to AnsibleForge is a one-line git change. An ArgoCD ApplicationSet reads the user list and automatically provisions a complete, isolated environment for each user.

## Adding users

Edit `openshift/user-projects/values.yaml`:

```yaml
users:
  - alice
  - bob
  - carol   # add here

repoURL: https://github.com/<your-fork>/ansibleforge.git
targetRevision: main
```

Commit and push. ArgoCD provisions the new user's environment on the next sync.

## What gets provisioned

For each user, ArgoCD renders the `user-devspace` Helm chart into `<username>-devspaces`:

| Resource | Description |
|----------|-------------|
| Namespace | `<username>-devspaces` |
| `workspace-env` ConfigMap | `VAULT_ADDR` and cluster env vars for workspace containers |
| `ansible-config` ExternalSecret | Pulls Automation Hub token from Vault → `ansible.cfg` |
| `quay-registry-secret` ExternalSecret | Pulls Quay credentials from Vault → Docker config JSON |
| ImageStreams | Mirrors shared build images into the user namespace |
| PVC | Persistent workspace storage |
| RBAC | User gets admin access to their namespace |
| SCC bindings | Required Security Context Constraints for workspace containers |
| **DevWorkspace** | Running workspace, started automatically |

## Auto-start on login

Each user's `DevWorkspace` is created with `started: true`, so the workspace is running when first provisioned. When the user logs into DevSpaces they are redirected straight to their workspace.

ArgoCD is configured to ignore changes to the `started` field (`ignoreDifferences`), so it won't fight DevSpaces when it stops idle workspaces. A stopped workspace shows a one-click **Start** button in the DevSpaces dashboard.

## Configurable values

| Value | Default | Description |
|-------|---------|-------------|
| `vaultAddr` | `http://vault.vault.svc:8200` | Vault address for workspace containers |
| `buildsNamespace` | `shared-builds` | Namespace where build images are stored |
| `gitPath` | `https://github.com/hfenner` | Git remote prefix for cloned projects |
