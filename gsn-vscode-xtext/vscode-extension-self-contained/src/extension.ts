import * as path from 'path';

import { Trace } from 'vscode-jsonrpc';
import {
    commands,
    window,
    workspace,
    ColorThemeKind,
    ExtensionContext,
    OutputChannel,
    Uri,
    ViewColumn,
    WebviewPanel,
} from 'vscode';
import { API as GitAPI } from './@types/git';
import { LanguageClient } from 'vscode-languageclient/node';
import { json2gsn } from 'json2gsn';

import { initializeLanguageClient } from './languageClient';
import { readInModelHash } from './util';
import CONSTANTS from './CONSTANTS';
import getGraphEventHandler, { checkAndSendModelToGraph, emitUndoRedoAvailable, postCommandToLSP } from './getGraphEventHandler';
import { ModelContext } from './@types/gsn';
import GsnDepi from './GsnDepi';
import { getGitApi, tryGetLocalGitUri } from './gitUtils';
import { Resource } from './@types/depi';


let lc: LanguageClient;
let ch: OutputChannel;
let panel: WebviewPanel;
let git: GitAPI;

function log(...messages: any[]) {
    if (!ch) {
        throw new Error('Channel not initialized');
    }

    const currentDate = new Date();
    const milliseconds = currentDate.getMilliseconds();
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    const timestamp = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    ch.appendLine(`${timestamp}.${formattedMilliseconds} - ${messages.join(' ')}`);
}
// This holds the state about which gsn model is being used.
const modelContext: ModelContext = {
    modelHash: null,
    dirUri: null,
    gsnDepi: null,
    undoStack: [],
    redoStack: [],
};

export async function activate(context: ExtensionContext) {
    ch = window.createOutputChannel('gsn-xtext');
    if (process.env.SEPARATE_SERVER) {
        // Only bring this up when debugging.
        ch.show();
    }

    log('Starting activation ...');
    lc = initializeLanguageClient(context);

    try {
        git = await getGitApi();
    } catch (err) {
        log(err);
        window.showErrorMessage((err as Error).message);
        return;
    }

    function getGsnCommandHandler(lspCommand: string) {
        return async () => {
            let activeEditor = window.activeTextEditor;
            if (!activeEditor || !activeEditor.document || activeEditor.document.languageId !== 'gsn') {
                window.showErrorMessage(`GSN Command must be invoked from an active .gsn-document.`);
                return;
            }

            const modelDir = path.dirname(activeEditor.document.uri.path);

            if (modelHasDirtyFiles(modelDir)) {
                window.showInformationMessage(
                    `The .gsn-documents are not persisted - save files before running command.`
                );
                return;
            }

            if (activeEditor.document.uri instanceof Uri) {
                await postCommandToLSP(log, lspCommand, { modelDir });
            }
        }
    }

    context.subscriptions.push(
        commands.registerCommand('gsn.assign-uuids', getGsnCommandHandler(CONSTANTS.LSP.ASSIGN_UUIDS_COMMAND))
    );
    context.subscriptions.push(
        commands.registerCommand('gsn.generate-model-json', getGsnCommandHandler(CONSTANTS.LSP.GENERATE_MODEL_JSON_COMMAND))
    );

    context.subscriptions.push(
        commands.registerCommand('gsn.get-model-json', async (modelDir: string) => {
            if (typeof modelDir !== 'string') {
                throw new Error('gsn.get-model-json takes a model directory path as first argument!');
            }

            return await postCommandToLSP(log, CONSTANTS.LSP.GENERATE_MODEL_JSON_COMMAND, { modelDir });
        })
    );

    context.subscriptions.push(
        commands.registerCommand('gsn.model-json-to-gsn', (modelJson: any[]) => {
            return json2gsn(modelJson);
        })
    );

    // enable tracing (.Off, .Messages, Verbose)
    await lc.setTrace(Trace.Verbose);
    try {
        await lc.start();
    } catch (err) {
        log('ERROR: Failed to start Java Language Server:');
        log(err.message);
        window.showErrorMessage('GSN Assurance failed to start Java Language Server');
        window.showErrorMessage('Make sure you have Java 8+ installed!');
        return;
    }

    log('Java Language Server started ...');
    const distUris = await getDistUris(context.extensionUri);

    async function showGraphEditor(dirPath: string, nodePath: string | null) {
        // Update the state holding model context.
        const oldDirUri = modelContext.dirUri;
        modelContext.dirUri = Uri.file(dirPath);
        modelContext.undoStack = [];
        modelContext.redoStack = [];

        log(`Model dir: ${dirPath}`);

        if (modelHasDirtyFiles(dirPath)) {
            window.showInformationMessage(
                `The .gsn-documents are not persisted - save files before opening editor.`
            );

            // Set back to to previously opened context (if there was one).
            modelContext.dirUri = oldDirUri;
            return;
        }

        modelContext.gsnDepi = new GsnDepi(git, modelContext.dirUri, log);

        if (panel) {
            log('Panel already existed - revealing it with new state..');
            panel.reveal();
        } else {
            log('No panel active - registering new event-listeners..');
            panel = window.createWebviewPanel('graph', 'GSN-Graph', ViewColumn.One, {
                retainContextWhenHidden: true,
                enableScripts: true,
            });

            const toDispose = [];

            toDispose.push(
                workspace.onDidSaveTextDocument(async (event) => {
                    const fpath = event.uri.path;

                    if (fpath.endsWith(CONSTANTS.FILE_EXTENSION) && modelContext.dirUri && fpath.startsWith(modelContext.dirUri.path)) {
                        log(`\nModel was updated via file: ${fpath}`);
                        modelContext.undoStack = [];
                        modelContext.redoStack = [];
                        try {
                            await emitUndoRedoAvailable(modelContext, panel, log);
                            const modelStr = await postCommandToLSP(log, CONSTANTS.LSP.GET_MODEL_JSON_COMMAND,
                                { modelDir: modelContext.dirUri.path });
                            await checkAndSendModelToGraph(panel, log, modelStr);
                            modelContext.modelHash = await readInModelHash(modelContext.dirUri);
                        } catch (err) {
                            await panel.webview.postMessage({
                                type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                                value: err.message,
                            });
                        }
                    }
                })
            );

            const graphEventHandler = getGraphEventHandler(modelContext, panel, log);
            toDispose.push(panel.webview.onDidReceiveMessage(graphEventHandler));

            panel.onDidDispose(
                () => {
                    panel = null;
                    modelContext.dirUri = null;
                    modelContext.modelHash = null;
                    modelContext.gsnDepi = null;
                    modelContext.undoStack = [];
                    modelContext.redoStack = [];
                    toDispose.forEach((d) => d.dispose());
                    log('Webview panel is disposed.');
                },
                undefined,
                context.subscriptions
            );
        }

        Object.keys(distUris).forEach((name) => {
            distUris[name] = panel.webview.asWebviewUri(distUris[name]);
            log(`${name}: ${distUris[name].toString()}`);
        });

        const config = workspace.getConfiguration('gsnGraph');

        const userPreferences = {
            enableDepi: config.get<boolean>('enableDepi', false),
            enforceUniqueNames: config.get<boolean>('enforceUniqueNames', false),
            lightMode: config.get<boolean>('lightMode', true),
            useShortGsnNames: config.get<boolean>('useShortGsnNames', true),
        };

        log(`User-preferences ${JSON.stringify(userPreferences)}`);
        const currentThemeKind = window.activeColorTheme.kind;
        const isDarkTheme = currentThemeKind === ColorThemeKind.Dark;

        log(`Is editor dark-mode? ${isDarkTheme}`);
        if (userPreferences.lightMode) {
            log(`lightMode enforced so wont use dark-mode`);
        }

        const webviewContent = getWebviewContent(distUris, userPreferences,
            userPreferences.lightMode ? false : isDarkTheme, nodePath);
        log(webviewContent);
        panel.webview.html = webviewContent;
        log('Done - graph-editor ready!');
    }

    context.subscriptions.push(
        commands.registerCommand('gsn.graph-editor', async () => {
            log(`\n ### New Graph Editor opened ###`);
            const editor = window.activeTextEditor;

            if (!editor || !editor.document || !editor.document.uri.fsPath.endsWith(CONSTANTS.FILE_EXTENSION)) {
                window.showInformationMessage(`GSN Graph Editor must be activated from an open .gsn-document.`);
                return;
            }

            const modelDirPath = path.dirname(editor.document.uri.fsPath);

            await showGraphEditor(modelDirPath, null);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('gsn.revealDepiResource', async (resource: Resource) => {
            log('revealDepiResource', JSON.stringify(resource));
            const [gitUrl, relModelDir] = resource.resourceGroupUrl.split(CONSTANTS.DEPI.GIT_URL_END_CHAR);
            const localRepoDir: Uri | null = await tryGetLocalGitUri(git.repositories, gitUrl, log);
            if (!localRepoDir) {
                window.showErrorMessage(`Could not find local clone of git-repo: "${gitUrl}"`);
                window.showInformationMessage(`Configure your depi extenions.`);
                return;
            }

            const modelDirPath = path.join(localRepoDir.fsPath, relModelDir);
            await showGraphEditor(modelDirPath, resource.url.substring(1)); // Remove leading "/"
        })
    );

    log('Activation done!');
}

export function deactivate() {
    return lc.stop();
}

function getWebviewContent({ jsBundleUri, cssBundleUri }, userPreferences: object, isDarkTheme: boolean, nodePath: string) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${cssBundleUri}" rel="stylesheet">
      <title>GSN</title>
  </head>
  <body style="color: ${isDarkTheme ? '#fff' : '#212B36'}; background-color: ${isDarkTheme ? 'rgb(18 18 18)' : '#fff'}; padding: 0; font-family: 'Roboto','Helvetica','Arial',sans-serif;">
    <div
        id="root"
        data-ts="${Date.now() /* Make sure it's unique so it doesn't keep any old model/state cached. */}"
        data-user-preferences='${JSON.stringify(userPreferences)}'
        data-dark-mode="${isDarkTheme}"
        data-node-id="${nodePath}"
    ></div>
    <script src="${jsBundleUri}"></script>
  </body>
  </html>`;
}

module.exports = {
    activate,
    deactivate,
};

async function getDistUris(extensionUri: Uri) {
    const assetManifestUri = Uri.joinPath(extensionUri, 'dist', 'bundle', 'asset-manifest.json');
    try {
        const readData = await workspace.fs.readFile(assetManifestUri);
        const manifest = JSON.parse(Buffer.from(readData).toString('utf8'));
        return {
            jsBundleUri: Uri.joinPath(extensionUri, 'dist', 'bundle', manifest.files['main.js']),
            cssBundleUri: Uri.joinPath(extensionUri, 'dist', 'bundle', manifest.files['main.css']),
        };
    } catch (err) {
        if (err.code === 'FileNotFound') {
            throw new Error('Could not find asset-manifest.json - did you run "npm build"?');
        }
        throw err;
    }
}

function modelHasDirtyFiles(dirPath: string): boolean {
    const dirtyFiles = [];

    window.tabGroups.all.flatMap(({ tabs }) =>
        tabs.map((tab: any) => {
            if (!tab || !tab.input || !tab.input.uri) {
                return tab;
            }

            const fpath = tab.input.uri.path;
            if (tab.isDirty && fpath.endsWith('.gsn') && fpath.startsWith(dirPath)) {
                dirtyFiles.push(fpath);
            }

            return tab;
        })
    );

    return dirtyFiles.length > 0;
}