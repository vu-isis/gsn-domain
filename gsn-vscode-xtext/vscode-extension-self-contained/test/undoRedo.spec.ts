import { getUndoRedoEntry, applyUndo, applyRedo, UndoRedoEntry } from '../src/undoRedo';
import { getSHA1Hash } from '../src/util';
import { Uri } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const modelDirPath = path.join(__dirname, 'test-undo-redo-model-dir');
const modelDirUri = Uri.file(modelDirPath);

beforeEach(async () => {
    if (!fs.existsSync(modelDirPath)) {
        fs.mkdirSync(modelDirPath);
    } else {
        fs.rmSync(modelDirPath, { recursive: true });
        fs.mkdirSync(modelDirPath);
    }
});

describe('getUndoRedoEntry, applyUndo, applyRedo', () => {
    it('should create undo/redo entries and apply undo/redo operations', async () => {
        const fileName = 'testFile.gsn';
        const baseContent = 'This is the base content.';
        const updatedContent = 'This is the updated content.';
        const baseFiles = new Map([[fileName, baseContent]]);

        fs.writeFileSync(path.join(modelDirPath, fileName), updatedContent);

        const undoRedoEntry = await getUndoRedoEntry(modelDirUri, baseFiles, 'some message');

        await applyUndo(modelDirUri, undoRedoEntry);
        let fileContent = fs.readFileSync(path.join(modelDirPath, fileName), 'utf-8');
        expect(fileContent).toBe(baseContent);

        await applyRedo(modelDirUri, undoRedoEntry);
        fileContent = fs.readFileSync(path.join(modelDirPath, fileName), 'utf-8');
        expect(fileContent).toBe(updatedContent);
    });

    it('should throw an error when the number of files does not match', async () => {
        const fileName1 = 'testFile1.gsn';
        const fileName2 = 'testFile2.gsn';
        const fileContent1 = 'This is test file 1.';

        const undoRedoEntry = new UndoRedoEntry(
            'some message',
            new Map([
                [fileName1, {
                    fileName: fileName1,
                    baseHash: 'does not matter',
                    newHash: 'does not matter',
                    patchesFromBase: null,
                    patchesToBase: null,
                }],
                [fileName2, {
                    fileName: fileName2,
                    baseHash: 'does not matter',
                    newHash: 'does not matter',
                    patchesFromBase: null,
                    patchesToBase: null,
                }],
            ])
        );

        fs.writeFileSync(path.join(modelDirPath, fileName1), fileContent1);

        await expect(applyUndo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot undo - not the same number of gsn files anymore!');
        await expect(applyRedo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot redo - not the same number of gsn files anymore!');
    });

    it('should throw an error when the file names does not match', async () => {
        const fileName1 = 'testFile1.gsn';
        const fileName2 = 'testFile2.gsn';
        const fileContent1 = 'This is test file 1.';

        const undoRedoEntry = new UndoRedoEntry(
            'some message',
            new Map([
                [fileName2, {
                    fileName: fileName2,
                    baseHash: 'does not matter',
                    newHash: 'does not matter',
                    patchesFromBase: null,
                    patchesToBase: null,
                }],
            ])
        );

        fs.writeFileSync(path.join(modelDirPath, fileName1), fileContent1);

        await expect(applyUndo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot undo - gsn files do not match anymore!');
        await expect(applyRedo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot redo - gsn files do not match anymore!');
    });

    it('should throw an error when the file content does not match', async () => {
        const fileName = 'testFile.gsn';
        const fileContent = 'This is a test file.';
        const undoRedoEntry = new UndoRedoEntry(
            'some message',
            new Map([
                [fileName, {
                    fileName,
                    baseHash: 'invalid_base_hash',
                    newHash: 'invalid_new_hash',
                    patchesFromBase: null,
                    patchesToBase: null,
                }],
            ])
        );

        fs.writeFileSync(path.join(modelDirPath, fileName), fileContent);

        await expect(applyUndo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot undo - gsn file content do not match anymore for testFile.gsn');
        await expect(applyRedo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot redo - gsn file content do not match anymore for testFile.gsn');
    });

    it('should throw an error when the resulting content does not match the expected content', async () => {
        const fileName = 'testFile.gsn';
        const baseContent = 'This is the base content.';
        const updatedContent = 'This is the updated content.';
        const invalidPatches = []; // Invalid patches that would not generate the expected content
        const baseHash = getSHA1Hash(baseContent); // SHA1 hash for baseContent
        const newHash = getSHA1Hash(updatedContent); // SHA1 hash for updatedContent

        const undoRedoEntry = new UndoRedoEntry(
            'some message',
            new Map([
                [fileName, {
                    fileName,
                    baseHash,
                    newHash,
                    patchesFromBase: invalidPatches,
                    patchesToBase: invalidPatches,
                }],
            ])
        );

        fs.writeFileSync(path.join(modelDirPath, fileName), updatedContent);

        await expect(applyUndo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot undo - new file content do not match previous testFile.gsn');
        fs.writeFileSync(path.join(modelDirPath, fileName), baseContent);

        await expect(applyRedo(modelDirUri, undoRedoEntry))
            .rejects.toThrow('Cannot redo - new file content do not match previous testFile.gsn');
    });

    it('should not modify the files when there are no differences', async () => {
        const fileName = 'testFile.gsn';
        const fileContent = 'This is a test file.';
        const baseFiles = new Map([[fileName, fileContent]]);

        fs.writeFileSync(path.join(modelDirPath, fileName), fileContent);

        const undoRedoEntry = await getUndoRedoEntry(modelDirUri, baseFiles, 'msg');

        expect(undoRedoEntry.fileInfos.get(fileName).baseHash).toEqual(undoRedoEntry.fileInfos.get(fileName).newHash);

        await applyUndo(modelDirUri, undoRedoEntry);
        let currentFileContent = fs.readFileSync(path.join(modelDirPath, fileName), 'utf-8');
        expect(currentFileContent).toBe(fileContent);

        await applyRedo(modelDirUri, undoRedoEntry);
        currentFileContent = fs.readFileSync(path.join(modelDirPath, fileName), 'utf-8');
        expect(currentFileContent).toBe(fileContent);
    });
});
