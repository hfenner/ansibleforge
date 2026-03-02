# HashiCorp Vault

**Chart:** `openshift/vault/` (wraps the official HashiCorp Helm chart)
**Namespace:** `vault`

## Overview

Vault is the central secret store for all credentials in AnsibleForge. It is fully self-configuring — a fresh deployment requires no manual Vault setup.

## Auto-initialization and unseal

A CronJob (`vault-unseal`) runs every minute and handles the complete Vault lifecycle:

1. Checks whether Vault is initialized
2. If not, runs `vault operator init` (1 key share), stores the unseal key and root token in the `vault-unseal-keys` Kubernetes Secret
3. Unseals Vault if sealed (e.g. after pod restart or node reboot)

Vault recovers automatically without any manual intervention.

## Auto-configuration (PostSync job)

A `vault-config` Job runs as an ArgoCD PostSync hook after every sync. It is fully idempotent:

### KV v2 secrets engine
```
vault secrets enable -path=secret kv-v2
```

### Kubernetes auth method
```
vault auth enable kubernetes
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc" \
  kubernetes_ca_cert=@<cluster-ca>
```

The `vault` ServiceAccount has `system:auth-delegator`, so Vault uses its own pod token to validate incoming tokens via the Kubernetes TokenReview API. No hardcoded `token_reviewer_jwt` needed.

### Roles and policies

| Role | Bound to | Policy |
|------|----------|--------|
| `external-secrets` | `cluster-external-secrets` SA in `external-secrets` ns | Read `secret/data/*` |
| `devspaces-user` | Any SA in any namespace | Read `secret/data/*` |

## Secrets to populate

| Path | Keys | Consumer |
|------|------|----------|
| `secret/ansible` | `automationhub_token` | `ansible.cfg` in user workspaces |
| `secret/quay` | `username`, `password` | Quay pull secret in user namespaces |

## Vault agent injection

Workspace pods receive secrets via the Vault agent sidecar injector, configured through `pod-overrides` in the DevSpaces devfile. Secrets are mounted at `/vault/secrets/` inside workspace containers.

## Console link

A ConsoleLink resource adds Vault to the OpenShift application menu. The URL is auto-discovered from the cluster's ingress domain via Helm lookup — no cluster-specific configuration required.
