# External Secrets Operator

**Chart:** `ocp/external-secrets/`
**Namespace:** `external-secrets`

## Overview

The External Secrets Operator (ESO) syncs secrets from external stores into Kubernetes Secrets on a configurable schedule. AnsibleForge configures two `ClusterSecretStore` backends available to any namespace.

## ClusterSecretStores

### vault
Authenticates to Vault using the `external-secrets` Kubernetes auth role. The `cluster-external-secrets` ServiceAccount is bound to this role by the [Vault PostSync job](vault.md).

```yaml
provider:
  vault:
    server: http://vault.vault.svc:8200
    path: secret
    version: v2
    auth:
      kubernetes:
        role: external-secrets
        serviceAccountRef:
          name: cluster-external-secrets
          namespace: external-secrets
```

### aws-secrets-manager
Authenticates via IRSA (IAM Roles for Service Accounts) — no static AWS credentials required.

```yaml
provider:
  aws:
    service: SecretsManager
    region: us-east-2
    auth:
      jwt:
        serviceAccountRef:
          name: cluster-external-secrets
          namespace: external-secrets
```

## Per-user secrets

Each user namespace receives two ExternalSecrets provisioned by the [User Provisioning](user-provisioning.md) ApplicationSet:

| Kubernetes Secret | Vault path | Contents |
|-------------------|------------|----------|
| `ansible-config` | `secret/ansible` | `ansible.cfg` with Automation Hub token |
| `quay-registry-secret` | `secret/quay` | Docker config JSON for `quay.io` |
