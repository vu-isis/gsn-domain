import { Uri } from 'vscode';
import { UndoRedoEntry } from '../undoRedo';
import GsnDepi from '../GsnDepi';

export interface ModelContext {
    modelHash: string,
    dirUri: Uri,
    gsnDepi: GsnDepi,
    undoStack: UndoRedoEntry[],
    redoStack: UndoRedoEntry[],
}
