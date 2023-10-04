import * as path from 'path';

import { commands, window, workspace, Range, Uri, ViewColumn, WebviewPanel, OutputChannel } from 'vscode';

import { getUndoRedoEntry, applyRedo, applyUndo } from './undoRedo';
import CONSTANTS from './CONSTANTS';
import { ModelContext } from './@types/gsn';
import {
    readInModelHash,
    readInViews,
    writeOutViews,
    readInLabels,
    writeOutLabels,
    getChangeMessage,
    readModelFiles,
    getModelHash,
    checkModelForLoops
} from './util';


export default function getGraphEventHandler(modelContext: ModelContext, panel: WebviewPanel, log: any) {
    async function processMessage(message: any) {
        const { type, key, value } = message;
        log(`\nGot message from graph-editor: ${JSON.stringify(message)}`);
        if (type === CONSTANTS.EVENTS.TYPES.REQUEST_MODEL) {
            log('Model was requested from Graph-Editor');
            try {
                const modelStr = await postCommandToLSP(log, CONSTANTS.LSP.GET_MODEL_JSON_COMMAND,
                    { modelDir: modelContext.dirUri.path });
                await checkAndSendModelToGraph(panel, log, modelStr);
                modelContext.modelHash = await readInModelHash(modelContext.dirUri);
                modelContext.undoStack = [];
                modelContext.redoStack = [];
                await emitUndoRedoAvailable(modelContext, panel, log);
            } catch (err) {
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                    value: err.message,
                });
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.REQUEST_VIEWS) {
            log('Views were requested from Graph-Editor');
            try {
                const viewsStr = await readInViews(modelContext.dirUri);
                await sendStateToGraph(panel, log, CONSTANTS.EVENTS.STATE_TYPES.VIEWS, viewsStr, null);
            } catch (err) {
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                    value: err.message,
                });
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.STATE_UPDATE && key === CONSTANTS.EVENTS.STATE_TYPES.VIEWS) {
            log('Writing new views to views.json');
            writeOutViews(modelContext.dirUri, value);
        } else if (type === CONSTANTS.EVENTS.TYPES.REQUEST_LABELS) {
            log('Labels were requested from Graph-Editor');
            try {
                const labelsStr = await readInLabels(modelContext.dirUri);
                await sendStateToGraph(panel, log, CONSTANTS.EVENTS.STATE_TYPES.LABELS, labelsStr, null);
            } catch (err) {
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                    value: err.message,
                });
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.STATE_UPDATE && key === CONSTANTS.EVENTS.STATE_TYPES.LABELS) {
            log('Writing new labels to labels.json');
            writeOutLabels(modelContext.dirUri, value);
        } else if (type === CONSTANTS.EVENTS.TYPES.STATE_UPDATE && key === CONSTANTS.EVENTS.STATE_TYPES.MODEL) {
            const argument = {
                modelDir: modelContext.dirUri.path,
                commandList: value
            };

            try {
                await emitUndoRedoAvailable(modelContext, panel, log, true);
                const baseFiles = await readModelFiles(modelContext.dirUri);
                const modelHash = getModelHash(baseFiles);

                if (modelContext.modelHash !== modelHash) {
                    throw new Error('Unknown changes were made to model - will not apply change');
                }

                const modelStr = await postCommandToLSP(log, CONSTANTS.LSP.MODEL_UPDATE_COMMAND, argument);
                const undoRedoEntry = await getUndoRedoEntry(modelContext.dirUri, baseFiles, getChangeMessage(value));

                log(`Updated files: ${undoRedoEntry.getUpdatedFiles().join(', ')}`);
                await checkAndSendModelToGraph(panel, log, modelStr);

                modelContext.modelHash = undoRedoEntry.getNewModelHash();
                modelContext.undoStack.push(undoRedoEntry);
                modelContext.redoStack = [];
                if (modelContext.undoStack.length > CONSTANTS.MAX_NUMBER_OF_UNDO) {
                    log(`Undo queue full at ${CONSTANTS.MAX_NUMBER_OF_UNDO} entries, removing oldest`);
                    modelContext.undoStack.shift();
                }

                await emitUndoRedoAvailable(modelContext, panel, log);
            } catch (err) {
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                    value: err.message,
                });
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.REVEAL_ORIGIN) {
            const { nodeId } = value;
            log(`Open Document for ${nodeId}`);
            const argument = {
                modelDir: modelContext.dirUri.path,
                nodeId,
            };

            let fileUri: Uri;
            try {
                const returnStr = await postCommandToLSP(log, CONSTANTS.LSP.REVEAL_ORIGIN_COMMAND, argument);
                const { filePath, lineNumber } = JSON.parse(returnStr);
                fileUri = Uri.joinPath(modelContext.dirUri, path.basename(filePath));
                await workspace.fs.stat(fileUri);
                window.showTextDocument(fileUri, {
                    viewColumn: ViewColumn.Active,
                    preview: false,
                    selection: new Range(lineNumber - 1, 0, lineNumber, 0)
                });
            } catch (err) {
                if (err.code === 'FileNotFound') {
                    log(fileUri.toString());
                    window.showInformationMessage(`No such file ${fileUri.path}`);
                } else {
                    window.showInformationMessage(err.message);
                }
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.UNDO) {
            try {
                const undoRedoEntry = modelContext.undoStack.pop();
                if (!undoRedoEntry) {
                    throw new Error('Nothing in undo-queue - cannot undo');
                }

                log(`Applying undo for "${undoRedoEntry.message}"`);
                const changedFiles = await applyUndo(modelContext.dirUri, undoRedoEntry);
                log(`Undid files: ${changedFiles.join(', ')}`);

                const modelStr = await postCommandToLSP(log, CONSTANTS.LSP.GET_MODEL_JSON_COMMAND,
                    { modelDir: modelContext.dirUri.path });
                await checkAndSendModelToGraph(panel, log, modelStr);

                modelContext.modelHash = undoRedoEntry.getBaseModelHash();
                modelContext.redoStack.push(undoRedoEntry);
                await emitUndoRedoAvailable(modelContext, panel, log);
            } catch (err) {
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                    value: err.message,
                });
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.REDO) {
            try {
                const undoRedoEntry = modelContext.redoStack.pop();
                if (!undoRedoEntry) {
                    throw new Error('Nothing in queue - cannot undo');
                }

                log(`Applying redo for "${undoRedoEntry.message}"`);
                const changedFiles = await applyRedo(modelContext.dirUri, undoRedoEntry);
                log(`Redid files: ${changedFiles.join(', ')}`);

                const modelStr = await postCommandToLSP(log, CONSTANTS.LSP.GET_MODEL_JSON_COMMAND,
                    { modelDir: modelContext.dirUri.path });

                await checkAndSendModelToGraph(panel, log, modelStr);

                modelContext.modelHash = undoRedoEntry.getNewModelHash();
                modelContext.undoStack.push(undoRedoEntry);
                await emitUndoRedoAvailable(modelContext, panel, log);
            } catch (err) {
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE,
                    value: err.message,
                });
            }
        } else if (type === CONSTANTS.EVENTS.TYPES.DEPI_CMD) {
            log('Depi command requested from Graph-Editor');
            const { commandId } = message;
            try {
                const res = await modelContext.gsnDepi[key](value);
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
                    commandId,
                    value: res,
                });
            } catch (err) {
                log(err);
                await panel.webview.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
                    commandId,
                    error: err.message,
                });
            }
        }
    }

    const eventJobQueue = [];
    let working = false;

    async function processNextJob() {
        if (working || eventJobQueue.length === 0) {
            return;
        }

        working = true;
        await processMessage(eventJobQueue.shift());
        working = false;
        setTimeout(processNextJob);
    }

    return function eventHandler(message: any) {
        eventJobQueue.push(message);
        processNextJob();
    }
}

async function sendStateToGraph(panel: WebviewPanel, log: any, stateType: string, valueStr: string, value: any) {
    log(`Sending updated ${stateType}: ${valueStr.substring(0, 100)}...`);
    if (!panel) {
        // This should never happen..
        log('Cannot send to graph when panel not intialized... (why is it not?)');
        return;
    }

    try {
        await panel.webview.postMessage({
            type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
            key: stateType,
            value: value || JSON.parse(valueStr),
        });
    } catch (err) {
        console.error(err);
        log(err.message);
        throw err;
    }
}

export async function checkAndSendModelToGraph(panel: WebviewPanel, log: any, modelStr: string) {
    const gsnModel = JSON.parse(modelStr);
    if (checkModelForLoops(gsnModel)) {
        throw new Error('Model contains loops - these must be broken up by removing relations.');
    }

    await sendStateToGraph(panel, log, CONSTANTS.EVENTS.STATE_TYPES.MODEL, modelStr, gsnModel);
}

export async function emitUndoRedoAvailable(modelContext: ModelContext, panel: WebviewPanel, log: any, forceFalse: boolean = false) {
    // forceFalse is there to avoid race-conditions while updates are computed.
    try {
        const value = {
            undo: forceFalse ? 0 : modelContext.undoStack.length,
            redo: forceFalse ? 0 : modelContext.redoStack.length,
        };

        log(`Emitting UNDO/REDO available: ${JSON.stringify(value)}`);
        await panel.webview.postMessage({
            type: CONSTANTS.EVENTS.TYPES.UNDO_REDO_AVAILABLE,
            value,
        });
    } catch (err) {
        console.error(err);
        log(err.message);
        throw err;
    }
}

export async function postCommandToLSP(log: any, command: string, argument: object) {
    log(`Will post to LSP Command: ${command}, arg: ${JSON.stringify(argument)}`);
    const responseStr = await commands.executeCommand(command, argument) as string;
    log(`Response: ${responseStr && responseStr.substring(0, 100)}...`);

    try {
        const parsed = JSON.parse(responseStr);
        if (typeof parsed === 'string') {
            throw new Error(parsed);
        }
    } catch (err) {
        console.error(err);
        log(responseStr);
        throw new Error(responseStr);
    }

    return responseStr;
}
