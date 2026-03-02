# GitLab

**Chart:** `ocp/gitlab/`
**Namespace:** `gitlab`

## Overview

GitLab is deployed via the GitLab Operator and provides source control, CI/CD pipelines, and container registry for the AnsibleForge environment. It is integrated with [Keycloak](keycloak.md) for single sign-on.

## Components deployed

- GitLab Operator Subscription (from OperatorHub)
- GitLab instance configured with the cluster domain
- ExternalSecret pulling GitLab OAuth credentials from Vault for Keycloak integration
- ConsoleLink for access from the OpenShift application menu

## Keycloak SSO integration

GitLab is configured to authenticate via Keycloak OpenID Connect. The OAuth client credentials are pulled from Vault via an ExternalSecret and injected into the GitLab configuration.

## Configuration

Update `ocp/gitlab/values.yaml` with your cluster domain:

```yaml
domain: apps.<cluster-domain>
```

!!! note
    The `domain` value is used in the GitLab operator spec and OAuth redirect URIs, so it cannot be auto-discovered via Helm lookup and must be set per-cluster.
