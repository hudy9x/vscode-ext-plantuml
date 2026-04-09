# Project Guidelines

## Build and Debug
- Install dependencies with `npm install`.
- Use `npm run compile` for a one-time TypeScript build.
- Use `npm run watch` during extension development.
- Use VS Code `F5` with the `Run Extension` launch config.
- The launch config uses `preLaunchTask: ${defaultBuildTask}`, which maps to `.vscode/tasks.json` and starts the `npm: watch` task.
- Keep `outFiles` pointing at `out/**/*.js` and keep `sourceMap: true` in `tsconfig.json` so breakpoints resolve correctly.

## Architecture
- Core extension behavior is implemented in `src/extension.ts`.
- The command `plantuml-preview.start` creates/reveals a webview and synchronizes preview content from the active editor.
- Webview UI assets are static files under `media/` and must be loaded via `webview.asWebviewUri(...)` from allowed `localResourceRoots`.
- Webview message contracts currently include `update`, `download`, and `download-png`; keep extension-side and webview-side message names in sync.
- PNG export is generated through `@resvg/resvg-js` from SVG content.

## Conventions
- This project uses strict TypeScript (`tsconfig.json`) and Node16 module output.
- Preserve supported PlantUML file handling (`.pu`, `.puml`, `.plantuml` and `plantuml` language id) when changing preview update logic.
- Keep webview scripts self-contained and offline; do not add server dependencies for rendering.

## Release and CI
- Release/versioning is driven by `commit-and-tag-version`; use Conventional Commits (`feat:`, `fix:`, etc.).
- `npm run build` updates version/changelog and creates a VSIX in `build/`.
- CI workflow `.github/workflows/build.yml` packages on PR/push and publishes a GitHub release on `main` pushes (requires `VSCODE_GITHUB_TOKEN`).

## References
- Project usage and publish workflow: [README.md](../README.md)
- Extension manifest and scripts: [package.json](../package.json)
- Debug launch settings: [launch.json](../.vscode/launch.json)
- Build task wiring: [tasks.json](../.vscode/tasks.json)