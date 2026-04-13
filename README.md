# Peach'd Up Studio

Video overlay editor built with Electron, React, and Remotion.

## Development

**Install dependencies**

```bash
npm install
```

**Start the app**

```bash
npm run dev
```

**Lint**

```bash
npm run lint
```

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) for version management. Releases are triggered automatically via GitHub Actions.

### How it works

1. **Add a changeset with your PR**
   Every PR that changes behavior should include a changeset describing what changed.

   ```bash
   npm run changeset
   ```

   Follow the prompts to select `patch`, `minor`, or `major` and write a short description. Commit the generated `.changeset/*.md` file alongside your changes.

2. **Merge your PR to `main`**
   GitHub Actions will automatically open (or update) a **"Version Packages"** PR that consolidates all pending changesets into a version bump and `CHANGELOG.md` update.

3. **Merge the "Version Packages" PR to release**
   When you're ready to ship, merge the Version Packages PR. This triggers the release workflow which:
   - Builds the macOS `.dmg` (with Apple signing and notarization)
   - Creates a GitHub Release tagged `v<version>`

### Changeset types

| Type | When to use |
|------|-------------|
| `patch` | Bug fixes, minor tweaks |
| `minor` | New features, non-breaking changes |
| `major` | Breaking changes |
