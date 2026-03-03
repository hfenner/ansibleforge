# Keycloak

**Chart:** `ocp/keycloak/`
**Namespace:** `keycloak`

## Overview

Keycloak is the identity provider for AnsibleForge, providing SSO across GitLab and other applications. It is deployed via the Keycloak Operator.

## Components deployed

- Keycloak Operator Subscription
- Keycloak instance with cluster-specific hostname
- `KeycloakRealmImport` with pre-configured GitLab OAuth client
- ExternalSecret pulling admin credentials from Vault
- ConsoleLink for access from the OpenShift application menu

## Realm configuration

A `KeycloakRealmImport` resource pre-configures the realm with an OAuth client for GitLab, including redirect URIs pointing to the GitLab instance.

## Configuration

Update `ocp/keycloak/values.yaml` with your cluster domain:

```yaml
domain: apps.<cluster-domain>
gitlabDomain: gitlab.apps.<cluster-domain>
```

!!! note
    Both values are used in the Keycloak hostname spec and OAuth redirect URIs, so they must be set per-cluster.
