"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const resvg_js_1 = require("@resvg/resvg-js");
function activate(context) {
    let currentPanel = undefined;
    let disposable = vscode.commands.registerCommand('plantuml-preview.start', () => {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
        }
        else {
            currentPanel = vscode.window.createWebviewPanel('plantumlPreview', 'PlantUML Preview', vscode.ViewColumn.Beside, {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            });
            currentPanel.webview.html = getWebviewContent(context, currentPanel.webview);
            currentPanel.webview.onDidReceiveMessage(async (message) => {
                if (message.command === 'download') {
                    const uri = await vscode.window.showSaveDialog({
                        filters: { 'SVG files': ['svg'] },
                        defaultUri: vscode.Uri.file('diagram.svg')
                    });
                    if (uri) {
                        await vscode.workspace.fs.writeFile(uri, Buffer.from(message.content, 'utf8'));
                        vscode.window.showInformationMessage('Diagram saved successfully!');
                    }
                }
                if (message.command === 'download-png') {
                    const uri = await vscode.window.showSaveDialog({
                        filters: { 'PNG files': ['png'] },
                        defaultUri: vscode.Uri.file('diagram.png')
                    });
                    if (uri) {
                        const svgUri = vscode.Uri.file(uri.fsPath.replace(/\.png$/i, '.svg'));
                        await vscode.workspace.fs.writeFile(svgUri, Buffer.from(message.content, 'utf8'));
                        const svgBuffer = await vscode.workspace.fs.readFile(svgUri);
                        const resvg = new resvg_js_1.Resvg(Buffer.from(svgBuffer));
                        const pngData = resvg.render();
                        const pngBuffer = pngData.asPng();
                        await vscode.workspace.fs.writeFile(uri, pngBuffer);
                        vscode.window.showInformationMessage('Diagram saved as SVG and PNG successfully!');
                    }
                }
            }, undefined, context.subscriptions);
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
            updateWebviewFromActiveEditor(currentPanel);
        }
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        if (currentPanel && e.document === vscode.window.activeTextEditor?.document) {
            updateWebviewFromEditor(currentPanel, e.document);
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (currentPanel && editor) {
            updateWebviewFromEditor(currentPanel, editor.document);
        }
    }));
}
function updateWebviewFromActiveEditor(panel) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        updateWebviewFromEditor(panel, editor.document);
    }
}
function updateWebviewFromEditor(panel, document) {
    const text = document.getText();
    const ext = path.extname(document.uri.fsPath).toLowerCase();
    const isPuml = text.includes('@start') ||
        document.languageId === 'plantuml' ||
        ['.pu', '.puml', '.plantuml'].includes(ext);
    if (isPuml) {
        panel.webview.postMessage({ command: 'update', text });
    }
}
function getWebviewContent(context, webview) {
    const plantumlScriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'media', 'plantuml.js'));
    const vizGlobalScriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'media', 'viz-global.js'));
    const mainCssPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'media', 'main.css'));
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
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    #container {
      width: 100vw;
      height: 100vh;
      cursor: grab;
      position: relative;
    }
    #container:active {
      cursor: grabbing;
    }
    #out {
      transform-origin: top left;
      width: fit-content;
      height: fit-content;
    }
    #loading {
      display: none;
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 8px;
    }
    .controls {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10;
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.9);
      padding: 8px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .controls button {
      cursor: pointer;
      padding: 4px 10px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 4px;
    }
    .controls button:hover {
      background: #f0f0f0;
    }
  </style>
</head>
<body>
  <div id="loading">Loading PlantUML...</div>
  <div class="controls">
    <button id="zoom-in" title="Zoom In">+</button>
    <button id="zoom-out" title="Zoom Out">-</button>
    <button id="download" title="Download SVG">Download As SVG</button>
    <button id="download-png" title="Download PNG">Download As PNG</button>
  </div>
  <div id="container">
    <div id="out"></div>
  </div>

  <script nonce="${nonce}" src="${plantumlScriptUri}"></script>
  <script nonce="${nonce}" src="${vizGlobalScriptUri}"></script>
  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      const loading = document.getElementById("loading");
      const out = document.getElementById("out");
      const container = document.getElementById("container");

      let scale = 1;
      let translateX = 0;
      let translateY = 0;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      function updateTransform() {
        out.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
      }

      function zoom(delta, clientX, clientY) {
        const oldScale = scale;
        scale *= (delta < 0 ? 1.1 : 0.9);
        scale = Math.max(0.1, Math.min(scale, 10));

        // Adjust translation to zoom towards the mouse cursor
        if (clientX !== undefined && clientY !== undefined) {
           const rect = container.getBoundingClientRect();
           const x = clientX - rect.left;
           const y = clientY - rect.top;
           translateX = x - (x - translateX) * (scale / oldScale);
           translateY = y - (y - translateY) * (scale / oldScale);
        } else {
           // Center zoom if no cursor specified
           const rect = container.getBoundingClientRect();
           const x = rect.width / 2;
           const y = rect.height / 2;
           translateX = x - (x - translateX) * (scale / oldScale);
           translateY = y - (y - translateY) * (scale / oldScale);
        }
        updateTransform();
      }

      container.addEventListener('wheel', e => {
        e.preventDefault();
        zoom(e.deltaY, e.clientX, e.clientY);
      });

      container.addEventListener('mousedown', e => {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
      });

      window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      document.getElementById('zoom-in').addEventListener('click', () => zoom(-1));
      document.getElementById('zoom-out').addEventListener('click', () => zoom(1));
      
      document.getElementById('download').addEventListener('click', () => {
        const svgHTML = out.innerHTML;
        if (svgHTML && svgHTML.trim() !== "") {
           vscode.postMessage({ command: 'download', content: svgHTML });
        }
      });

      document.getElementById('download-png').addEventListener('click', () => {
        const svgHTML = out.innerHTML;
        if (svgHTML && svgHTML.trim() !== "") {
           vscode.postMessage({ command: 'download-png', content: svgHTML });
        }
      });

      try {
        plantumlLoad();
      } catch(err) {
        console.error("Error loading plantuml:", err);
      }

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'update') {
          try {
             // Reset zoom/pan on update for a fresh view
             scale = 1; translateX = 0; translateY = 0;
             updateTransform();

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
function deactivate() { }
//# sourceMappingURL=extension.js.map