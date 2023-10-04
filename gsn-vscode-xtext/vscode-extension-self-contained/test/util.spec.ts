import {
    readModelFiles,
    writeModelFiles,
    getSHA1Hash,
    computeModelHash,
    readInModelHash,
    getModelHash,
    checkModelForLoops,
} from '../src/util';
import { Uri } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const modelDirPath = path.join(__dirname, 'test-util-dir');
const modelDirUri = Uri.file(modelDirPath);

beforeEach(async () => {
    if (!fs.existsSync(modelDirPath)) {
        fs.mkdirSync(modelDirPath);
    } else {
        fs.rmSync(modelDirPath, { recursive: true });
        fs.mkdirSync(modelDirPath);
    }
});

describe('getSHA1Hash', () => {
    it('should return the correct SHA1 hash for a given string', () => {
        const input = 'This is a test string.';
        const expectedHash = '3532499280b4e2f32f6417e556901a526d69143c';

        const result = getSHA1Hash(input);
        expect(result).toBe(expectedHash);
    });
});


describe('readModelFiles', () => {
    it('should read model files from the directory', async () => {
        const fileName = 'testFile.gsn';
        const fileContent = 'This is a test file.';
        fs.writeFileSync(path.join(modelDirPath, fileName), fileContent);

        const result = await readModelFiles(modelDirUri);
        expect(result.get(fileName)).toBe(fileContent);
    });
});

describe('writeModelFiles', () => {
    it('should write model files to the directory', async () => {
        const fileName = 'testFile.gsn';
        const fileContent = 'This is a test file.';
        const files = new Map([[fileName, fileContent]]);

        await writeModelFiles(modelDirUri, files);

        const fileExists = fs.existsSync(path.join(modelDirPath, fileName));
        expect(fileExists).toBe(true);
    });
});

describe('Model hash functions', () => {
    const testFiles = new Map([
        ['file1.gsn', 'This is file1 content'],
        ['file2.gsn', 'This is file2 content'],
        ['file3.gsn', 'This is file3 content'],
    ]);

    it('should compute the correct model hash using computeModelHash', () => {
        const fileNameToHash = {};

        testFiles.forEach((content, fileName) => {
            fileNameToHash[fileName] = getSHA1Hash(content);
        });

        const expectedModelHash = '82b5940b04bc0ebd62162fc1ab4cad090307a96a';
        expect(computeModelHash(fileNameToHash)).toBe(expectedModelHash);
    });

    it('should compute the correct model hash using getModelHash', () => {
        const expectedModelHash = '82b5940b04bc0ebd62162fc1ab4cad090307a96a';
        expect(getModelHash(testFiles)).toBe(expectedModelHash);
    });

    it('should compute the correct model hash using readInModelHash', async () => {
        testFiles.forEach((content, fileName) => {
            fs.writeFileSync(path.join(modelDirPath, fileName), content);
        });

        const expectedModelHash = '82b5940b04bc0ebd62162fc1ab4cad090307a96a';
        const modelHash = await readInModelHash(modelDirUri);
        expect(modelHash).toBe(expectedModelHash);
    });
});

describe('loop checking', () => {
    const loopModel = [
        {

            "solvedBy": ["loop/g1"],
            "id": "loop/g0",
            "inContextOf": []
        },
        {
            "solvedBy": ["loop/g2"],
            "id": "loop/g1",
            "inContextOf": []
        },
        {
            "solvedBy": ["loop/g1"],
            "id": "loop/g2",
            "inContextOf": []
        }
    ];

    it('should return true when loops are present in the model', ()=> {
        expect(checkModelForLoops(loopModel)).toBe(true);
    });

    it('should return false when with no loops in model', ()=> {
        const noLoopModel = JSON.parse(JSON.stringify(loopModel));
        noLoopModel[2].solvedBy = [];
        expect(checkModelForLoops(noLoopModel)).toBe(false);
    });
})