/* globals beforeAll, test, describe, expect */
import {
    tryParseViewExpression,
    evaluateViewExpression,
    applyViewToModel,
} from '../../../src/components/graph/TopMenu/ViewEditor/viewUtils';
import GSN_CONSTANTS from '../../../src/components/graph/GSN_CONSTANTS';
import model from '../../../src/examples/control_system';
import { ROV_MODEL, ROV_LABELS } from '../LabelEditor/ROV_LABELS';

const { LOGICAL_SYMBOLS } = GSN_CONSTANTS;

describe('viewExpressions', () => {
    let modelWithLabels;
    const labels = [
        { name: 'mylabel' },
        { name: 'label' },
        { name: 'sol' },
        { name: 'gol' },
        { name: 'myLabel' },
        { name: 'aLabel' },
        { name: 'ali babba' },
        { name: 'my Label' },
        { name: 'einLabel' },
        { name: 'anotherLabel' },
    ];

    beforeAll(() => {
        modelWithLabels = JSON.parse(JSON.stringify(model));
        modelWithLabels.forEach((node) => {
            switch (node.id) {
                case 'model/G1/G3/S2/G7/Sn3':
                case 'model/G1/G3/S2/G8/Sn4':
                    node.labels = ['sol'];
                    break;
                case 'model/G1/G2':
                    node.labels = ['gol'];
                    break;
                default:
                    break;
            }
        });

        const sorter = (n1, n2) => n1.id.localeCompare(n2.id);
        modelWithLabels.sort(sorter);
    });

    test('should return empty array at empty string and should evaluate to true', () => {
        const expr = '';
        expect(tryParseViewExpression(expr, labels)).toMatchObject([]);
        expect(evaluateViewExpression([], [])).toBe(true);
    });

    [
        `mylabel${LOGICAL_SYMBOLS.AND}`,
        `mylabel${LOGICAL_SYMBOLS.OR}`,
        `${LOGICAL_SYMBOLS.AND}mylabel`,
        `${LOGICAL_SYMBOLS.OR}mylabel`,
        `mylabel${LOGICAL_SYMBOLS.AND}${LOGICAL_SYMBOLS.NOT}`,
        `mylabel${LOGICAL_SYMBOLS.OR}${LOGICAL_SYMBOLS.NOT}`,
        `${LOGICAL_SYMBOLS.NOT}${LOGICAL_SYMBOLS.AND}mylabel`,
        `${LOGICAL_SYMBOLS.NOT}${LOGICAL_SYMBOLS.OR}mylabel`,
    ].forEach((expr, idx) => {
        // console.log(idx, '-->', expr);
        test(`should throw at empty sub-expression ${idx}`, () => {
            expect(() => tryParseViewExpression(expr, labels)).toThrow('Sub-expressions cannot be empty');
        });
    });

    test('Negate must come before label 1', () => {
        const expr = `mylabel${LOGICAL_SYMBOLS.NOT}`;
        expect(() => tryParseViewExpression(expr, labels)).toThrow(
            'Negate-operator (!) can only be used before a label'
        );
    });

    test('Negate must come before label 2', () => {
        const expr = `mylabel${LOGICAL_SYMBOLS.NOT}label`;
        expect(() => tryParseViewExpression(expr, labels)).toThrow(
            'Negate-operator (!) can only be used before a label'
        );
    });

    test('single label should be one or and one and', () => {
        const expr = 'mylabel';
        expect(tryParseViewExpression(expr, labels)).toMatchObject([[{ isNegated: false, label: 'mylabel' }]]);
    });

    test('negated single label should be one or and one and', () => {
        const expr = `${LOGICAL_SYMBOLS.NOT}myLabel`;
        expect(tryParseViewExpression(expr, labels)).toMatchObject([[{ isNegated: true, label: 'myLabel' }]]);
    });

    test('should trim white-spaces only at ends', () => {
        const expr = ` ${LOGICAL_SYMBOLS.NOT} my Label ${LOGICAL_SYMBOLS.AND}   ali babba `;
        expect(tryParseViewExpression(expr, labels)).toMatchObject([
            [
                { isNegated: true, label: 'my Label' },
                { isNegated: false, label: 'ali babba' },
            ],
        ]);
    });

    test('single label should be a match when included', () => {
        const expr = 'myLabel';
        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['aLabel', 'myLabel'])).toBe(true);
    });

    test('single label should NOT be a match when NOT included', () => {
        const expr = 'myLabel';
        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['aLabel', 'einLabel'])).toBe(false);
    });

    test('single negated label should be a match when NOT included', () => {
        const expr = `${LOGICAL_SYMBOLS.NOT}myLabel`;
        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['aLabel', 'einLabel'])).toBe(true);
    });

    test('single label should NOT be a match when NOT included', () => {
        const expr = `${LOGICAL_SYMBOLS.NOT}myLabel`;
        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['aLabel', 'myLabel'])).toBe(false);
    });

    test('all ANDs must hold', () => {
        const expr = `aLabel${LOGICAL_SYMBOLS.AND}myLabel${LOGICAL_SYMBOLS.AND}anotherLabel`;
        expect(
            evaluateViewExpression(tryParseViewExpression(expr, labels), ['aLabel', 'myLabel', 'anotherLabel'])
        ).toBe(true);

        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['aLabel', 'myLabel'])).toBe(false);
    });

    test('any ORs is enough be true', () => {
        const expr = `aLabel${LOGICAL_SYMBOLS.OR}myLabel${LOGICAL_SYMBOLS.OR}anotherLabel`;
        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['myLabel'])).toBe(true);
    });

    test('any ORs is enough be true', () => {
        const expr = `aLabel${LOGICAL_SYMBOLS.OR}myLabel${LOGICAL_SYMBOLS.OR}anotherLabel`;
        expect(evaluateViewExpression(tryParseViewExpression(expr, labels), ['myLabel'])).toBe(true);
    });

    test('applyViewToModel returns the original model when there is no view expression', () => {
        const result = applyViewToModel(modelWithLabels, labels, { expression: '' }).map((n) => n.id);
        expect(result).toEqual(modelWithLabels.map((n) => n.id));
    });

    test('applyViewToModel filters nodes based on the view expression', () => {
        const result = applyViewToModel(modelWithLabels, labels, {
            expression: `sol${LOGICAL_SYMBOLS.OR}gol`,
        }).map((n) => n.id);

        const expectedResult = ['model/G1/G2', 'model/G1/G3/S2/G7/Sn3', 'model/G1/G3/S2/G8/Sn4'];
        expect(result).toEqual(expectedResult);
    });

    test('applyViewToModel includes parents specified', () => {
        const result = applyViewToModel(modelWithLabels, labels, {
            expression: `gol`,
            includeParents: true,
        }).map((n) => n.id);

        const expectedResult = ['model/G1', 'model/G1/G2'];
        expect(result).toEqual(expectedResult);
    });

    test('applyViewToModel includes children specified', () => {
        const result = applyViewToModel(modelWithLabels, labels, {
            expression: `gol`,
            includeSubtrees: true,
        }).map((n) => n.id);

        // Also includes context-nodes.
        expect(result).toHaveLength(10);
    });

    describe('applyToViewToModel with groups in expression', () => {
        test('OperatingModes should return all nodes with an operatingModeLabel', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `OperatingModes`,
            }).map((n) => n.name);

            expect(result).toHaveLength(4);
            expect(result).not.toContain('GROUND_ROVER');
            expect(result).not.toContain('NoLabel');
        });

        test('OperatingModes and VehicleType should return all nodes with a label in both', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `OperatingModes${LOGICAL_SYMBOLS.AND}VehicleType`,
            }).map((n) => n.name);

            expect(result).toHaveLength(1);
            expect(result).toContain('PipeTrackingROV');
        });

        test('Not OperatingModes and VehicleType should return all nodes with a label only in VehicleType', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `${LOGICAL_SYMBOLS.NOT}OperatingModes${LOGICAL_SYMBOLS.AND}VehicleType`,
            }).map((n) => n.name);

            expect(result).toHaveLength(1);
            expect(result).toContain('GROUND_ROVER');
        });

        test('OperatingModes or VehicleType should return all nodes with a label in either', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `OperatingModes${LOGICAL_SYMBOLS.OR}VehicleType`,
            }).map((n) => n.name);

            expect(result).toHaveLength(5);
            expect(result).not.toContain('NoLabel');
        });

        test('Not OperatingModes and Not VehicleType should return all nodes with no labels in either', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `${LOGICAL_SYMBOLS.NOT}OperatingModes${LOGICAL_SYMBOLS.AND}${LOGICAL_SYMBOLS.NOT}VehicleType`,
            }).map((n) => n.name);

            expect(result).toHaveLength(1);
            expect(result).toContain('NoLabel');
        });

        test('OperatingModes and Not NominalModes should only "pure" faulty nodes', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `OperatingModes${LOGICAL_SYMBOLS.AND}${LOGICAL_SYMBOLS.NOT}NominalModes`,
            }).map((n) => n.name);

            expect(result).toHaveLength(1);
            expect(result).toContain('LowBattery');
        });

        test('FaultyModes should return any node with FaultyMode label', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `FaultyModes`,
            }).map((n) => n.name);

            expect(result).toHaveLength(2);
            expect(result).toContain('LowBattery');
            expect(result).toContain('LowBatteryDescending');
        });

        test('* (Universe) should return all node with atleast one label', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `${LOGICAL_SYMBOLS.UNIVERSE}`,
            }).map((n) => n.name);

            expect(result).toHaveLength(5);
            expect(result).not.toContain('NoLabel');
        });

        test('Not * (Universe) should return all nodes without a label', () => {
            const result = applyViewToModel(ROV_MODEL, ROV_LABELS, {
                expression: `${LOGICAL_SYMBOLS.NOT}${LOGICAL_SYMBOLS.UNIVERSE}`,
            }).map((n) => n.name);

            expect(result).toHaveLength(1);
            expect(result).toContain('NoLabel');
        });
    });
});
