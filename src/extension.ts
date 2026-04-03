import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('plantuml-preview.start', () => {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        'plantumlPreview',
        'PlantUML Preview',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        }
      );

      currentPanel.webview.html = getWebviewContent(context, currentPanel.webview);

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );

      updateWebviewFromActiveEditor(currentPanel);
    }
  });

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (currentPanel && e.document === vscode.window.activeTextEditor?.document) {
        updateWebviewFromEditor(currentPanel, e.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (currentPanel && editor) {
        updateWebviewFromEditor(currentPanel, editor.document);
      }
    })
  );
}

function updateWebviewFromActiveEditor(panel: vscode.WebviewPanel) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    updateWebviewFromEditor(panel, editor.document);
  }
}

function updateWebviewFromEditor(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
  const text = document.getText();
  const ext = path.extname(document.uri.fsPath).toLowerCase();
  const isPuml = text.includes('@start') ||
    document.languageId === 'plantuml' ||
    ['.pu', '.puml', '.plantuml'].includes(ext);
  if (isPuml) {
    panel.webview.postMessage({ command: 'update', text });
  }
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview) {
  const plantumlScriptPathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, 'media', 'plantuml.js')
  );
  const vizGlobalScriptPathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, 'media', 'viz-global.js')
  );
  const mainCssPathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, 'media', 'main.css')
  );

  const plantumlScriptUri = webview.asWebviewUri(plantumlScriptPathOnDisk);
  const vizGlobalScriptUri = webview.asWebviewUri(vizGlobalScriptPathOnDisk);
  const mainCssUri = webview.asWebviewUri(mainCssPathOnDisk);

  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PlantUML Live Preview</title>
  <link rel="stylesheet" href="${mainCssUri}">
  <style>
    body {
      background-color: white;
      padding: 10px;
    }
    #out {
      width: 100%;
      height: 100%;
    }
    #loading {
      display: none;
    }
  </style>
</head>
<body>
  <div id="loading">Loading PlantUML...</div>
  <div id="out"></div>

  <script nonce="${nonce}" src="${plantumlScriptUri}"></script>
  <script nonce="${nonce}" src="${vizGlobalScriptUri}"></script>
  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      const loading = document.getElementById("loading");
      const out = document.getElementById("out");

      try {
        plantumlLoad();
      } catch(err) {
        console.error("Error loading plantuml:", err);
      }

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'update') {
          try {
             const lines = message.text.split(/\\r\\n|\\r|\\n/);
             window.plantuml.render(lines, "out");
          } catch(e) {
             console.error("Rendering error:", e);
          }
        }
      });
    }());
  </script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() { }
