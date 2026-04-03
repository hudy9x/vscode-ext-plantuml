# PlantUML Live Preview Extension

A lightweight, fully offline Visual Studio Code extension that provides a rich, real-time Live Preview for PlantUML (`.puml`, `.pu`, `.plantuml`) documents.

## Features

- **Live Preview Setup**: Split-pane live preview parsing of PlantUML syntax as you type.
- **Interactive Diagram**: Pan and Zoom (via mouse wheel or UI buttons) natively within the webview.
- **Fast and Offline**: Processes diagram logic directly through bundled `plantuml.js` without relying on slow external server connections.
- **Export Capabilities**: Cleanly export and save the generated SVG anywhere on your system directly from the preview UI.

## How to Install Locally

If you just want to run or install this extension manually on your machine without publishing it:

### 1. Run via Extension Host (For Development)
1. Open this repository folder in VSCode.
2. Run `npm install` inside the terminal to retrieve developer dependencies.
3. Press `F5` to open an "Extension Development Host" window. You can open any `.puml` file and test the extension directly!

### 2. Versioning and Building a `.vsix`
When making changes, commit them using Conventional Commits (e.g., `feat: ...`, `fix: ...`). Then, to automatically bump the version, update the changelog, and build the final `.vsix` extension file:
1. Run the unified build command:
   ```bash
   npm run build
   ```
   This will automatically update the version and changelog, and output the `plantuml-preview-x.x.x.vsix` file into the `build/` directory.
2. In VSCode, go to the Extensions view (`Cmd+Shift+X` on Mac).
3. Click the `...` menu at the top right of the Extensions panel and select **Install from VSIX...**.
4. Select the `.vsix` file from the `build/` folder. The extension is now permanently installed!

## How to Publish to the VSCode Marketplace

If you want to publish this to the public Visual Studio Code Marketplace so anyone can find and install it:

1. **Install `vsce`**:
   Ensure you have the VSCode Extension Manager installed globally via npm:
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Create an Azure DevOps Organization & Publisher**:
   - Go to [Azure DevOps](https://dev.azure.com/) and create a free organization.
   - Go to the [VSCode Marketplace Publisher Management](https://marketplace.visualstudio.com/manage) and create a Publisher profile. **Note:** Make sure to update the `publisher` field in your `package.json` to match the publisher ID you pick!

3. **Generate a Personal Access Token (PAT)**:
   - Within your Azure DevOps organization, go to your Profile (top right) -> Personal Access Tokens.
   - Generate a new Token, giving it `Marketplace` (acquire/manage/publish) access scope.

4. **Login via CLI**:
   Run the following command and provide your PAT when prompted:
   ```bash
   vsce login <publisher-name>
   ```

5. **Update `package.json` details**:
   Make sure you have added a `publisher` property, a valid repository `url`, an `icon`, etc., to your `package.json` before publishing so that your Marketplace page looks clean.

6. **Publish**:
   Execute the publish command from within the extension directory:
   ```bash
   vsce publish
   ```
   *Note: Ensure you increment the `version` inside `package.json` whenever you publish updates!*
