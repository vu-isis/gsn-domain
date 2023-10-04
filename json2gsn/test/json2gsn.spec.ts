import * as fs from 'fs';
import * as path from 'path';
import { populateNamespaces, json2gsn } from '../src/json2gsn';

const gaussModelDir = './test/models/gauss';
const gaussModel = JSON.parse(fs.readFileSync(path.join(gaussModelDir, 'model.json'), 'utf8'));
const loopModel = JSON.parse(fs.readFileSync('./test/models/loop/model.json', 'utf8'));

describe('populateNamespaces', () => {
    it('should return simple namespace', () => {
        const gsnModel = [
            {
                id: 'nsp/G1',
                type: 'Goal',
                solvedBy: ['nsp/G1/G12']
            },
            {
                id: 'nsp/G1/G12',
                type: 'Goal',
            },
        ];

        const { namespaces, errors } = populateNamespaces(gsnModel);
        expect(errors).toBeNull();
        expect(namespaces.length).toBe(1);
        expect(namespaces[0].roots[0].children[0].path).toBe('nsp/G1/G12');
    });

    it('should break up nodes in namespaces', () => {
        const gsnModel = [
            {
                id: 'nsp/G1',
                type: 'Goal',
                solvedBy: ['nsp2/G12']
            },
            {
                id: 'nsp2/G12',
                type: 'Goal',
            },
        ];

        const { namespaces, errors } = populateNamespaces(gsnModel);
        expect(errors).toBeNull();
        expect(namespaces.length).toBe(2);
        expect(namespaces[0].roots[0].children.length).toBe(0);
        expect(namespaces[1].roots[0].children.length).toBe(0);
    });

    describe('error handling', () => {
        it('null id should be error', () => {
            const gsnModel = [
                {
                    id: null,
                    type: 'Goal',
                }
            ];

            const { namespaces, errors } = populateNamespaces(gsnModel);

            // Assert: Check that errors were generated and there are no namespaces
            expect(errors[0].message.includes('missing string id')).toBe(true);
            expect(namespaces).toBeNull();
        });
    });
});

describe('json2gsn', () => {
    it('should generate gauss model', () => {
        const gaussGsn = fs.readFileSync(path.join(gaussModelDir, 'gauss.gsn'), 'utf8');

        const { contents, errors } = json2gsn(gaussModel);
        expect(errors).toBeNull();
        expect(contents.size).toBe(1);
        expect(contents.get('gauss')).toBe(gaussGsn);
    });

    it('should detect loops in model', () => {
        const { contents, errors } = json2gsn(loopModel);
        expect(errors.length).toBe(1);
        expect(errors[0].message.includes('is not a DAG, it forms 1 loop(s)')).toBe(true);
    });
});