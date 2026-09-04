# Why this fork exists

Upstream: [LibreChat-AI/admin-panel](https://github.com/LibreChat-AI/admin-panel) (AGPL-3.0).

The configuration form is generated from `configSchema` in
`librechat-data-provider`, so the panel can only edit fields that package
declares. TensorGrid's LibreChat fork adds config of its own — first
`modelSpecs.imageList`, the image models offered behind the chat input's Image
Gen toggle — and the published package knows nothing about them.

## What changed

- **`Dockerfile`** — a `data-provider` stage builds the Tchat fork's copy of
  `librechat-data-provider` and installs it over the published one, in both the
  build stage (Vite bundles the schema) and the runtime stage (the server reads
  it too). `TCHAT_REPO` and `TCHAT_REF` are build args; `TCHAT_REF` defaults to
  `main`.
- **`.github/workflows/docker-publish.yml`** — publishes
  `ghcr.io/<owner>/tchat-admin` instead of the upstream image name, amd64 only.

Nothing else is modified, so `git merge upstream/main` should stay routine.

## Keeping up with upstream

```bash
git fetch upstream && git merge upstream/main
```

Conflicts are expected only in the two files above.
