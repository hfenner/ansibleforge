# Ansible Automation Platform

**Chart:** `ocp/aap/`
**Namespace:** `aap`

## Overview

Ansible Automation Platform (AAP) is deployed via the Red Hat AAP Operator. It provides the controller (formerly AWX/Tower) for scheduling and running automation jobs using the [ee-dragonslair](../containers/ee-dragonslair.md) Execution Environment.

## Components deployed

- AAP Operator Subscription (from Red Hat Operators)
- `AnsibleAutomationPlatform` instance
- ConsoleLink for access from the OpenShift application menu

## Using ee-dragonslair as the EE

The `ee-dragonslair` image built by [Shared Builds](shared-builds.md) is available to AAP via the internal image registry. Configure it as an EE in AAP:

```
image-registry.openshift-image-registry.svc:5000/shared-builds/ee-dragonslair:latest
```

This ensures automation runs with the same collections and tools available in the DevSpaces workspace.

## Configuration

Update `ocp/aap/values.yaml` with your cluster domain:

```yaml
domain: apps.<cluster-domain>
```
