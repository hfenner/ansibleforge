# External Secrets Operator

**Chart:** `ocp/gitops/external-secrets/`
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
Only deployed on AWS clusters — a Helm `lookup` on the cluster `Infrastructure` object checks `.status.platform` at sync time and skips this store on non-AWS clusters.

Credentials are provisioned automatically by the [Cloud Credentials Operator (CCO)](https://docs.openshift.com/container-platform/latest/authentication/managing_cloud_provider_credentials/about-cloud-credential-operator.html) via a `CredentialsRequest` in the same chart. CCO creates the `external-secrets-aws-credentials` Secret with a scoped IAM policy (`secretsmanager:GetSecretValue`, `secretsmanager:ListSecrets`, `kms:Decrypt`) — no static keys are stored in git.

```yaml
provider:
  aws:
    service: SecretsManager
    region: us-east-2
    auth:
      secretRef:
        accessKeyIDSecretRef:
          name: external-secrets-aws-credentials
          namespace: external-secrets
          key: aws_access_key_id
        secretAccessKeySecretRef:
          name: external-secrets-aws-credentials
          namespace: external-secrets
          key: aws_secret_access_key
```

## Per-user secrets

Each user namespace receives two ExternalSecrets provisioned by the [User Provisioning](user-provisioning.md) ApplicationSet:

| Kubernetes Secret | Vault path | Contents |
|-------------------|------------|----------|
| `ansible-config` | `secret/ansible` | `ansible.cfg` with Automation Hub token |
| `quay-registry-secret` | `secret/quay` | Docker config JSON for `quay.io` |
