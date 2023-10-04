/* globals test, describe, expect */
import { resolveGroupMembers } from '../../../src/components/graph/TopMenu/labelUtils';
import { ROV_LABELS } from './ROV_LABELS';

describe('labelUtils', () => {
    describe('resolveGroupMembers', () => {
        test('should add all labels to implied * group', () => {
            const labels = [
                {
                    isGroup: false,
                    name: 'MyLabel1',
                },
                {
                    isGroup: false,
                    name: 'MyLabel2',
                },
                {
                    isGroup: false,
                    name: 'MyLabel3',
                },
            ];

            const result = resolveGroupMembers(labels);
            expect(result.size).toBe(1);
            result.forEach((value) => {
                expect(value.size).toBe(3);
                labels.forEach((label) => {
                    expect(value.has(label.name)).toBeTruthy();
                });
            });
        });

        test('should propagate member of sub-group to all parents', () => {
            const labels = [
                {
                    isGroup: false,
                    name: 'MyLabel',
                    description: 'Example label',
                },
                {
                    isGroup: true,
                    name: 'MyLabelGroup',
                    parent: null,
                    members: [],
                },
                {
                    isGroup: true,
                    name: 'SubGroup',
                    parent: 'MyLabelGroup',
                    members: ['MyLabel'],
                },
            ];

            const result = resolveGroupMembers(labels);
            expect(result.size).toBe(3);
            result.forEach((value) => {
                expect(value.size).toBe(1);
                expect(Array.from(value)[0]).toBe('MyLabel');
            });
        });

        test('should propagate member of sub-group to all parents and merge with existing', () => {
            const labels = [
                {
                    isGroup: false,
                    name: 'NoGroupLabel',
                },
                {
                    isGroup: false,
                    name: 'GroupLabel',
                },
                {
                    isGroup: false,
                    name: 'SubGroup1Label',
                },
                {
                    isGroup: false,
                    name: 'SubGroup2Label',
                },
                {
                    isGroup: true,
                    name: 'MyLabelGroup',
                    parent: null,
                    members: ['GroupLabel'],
                },
                {
                    isGroup: true,
                    name: 'SubGroup1',
                    parent: 'MyLabelGroup',
                    members: ['SubGroup1Label'],
                },
                {
                    isGroup: true,
                    name: 'SubGroup2',
                    parent: 'MyLabelGroup',
                    members: ['SubGroup2Label'],
                },
            ];

            const result = resolveGroupMembers(labels);
            expect(result.size).toBe(4);
            expect(result.get('*').size).toBe(4);
            expect(result.get('MyLabelGroup').size).toBe(3);
            expect(result.get('SubGroup1').size).toBe(1);
            expect(result.get('SubGroup2').size).toBe(1);
        });

        test('should propagate member of sub-group to all parents and only include inherted labels', () => {
            const labels = [
                {
                    isGroup: false,
                    name: 'NoGroupLabel',
                },
                {
                    isGroup: false,
                    name: 'GroupLabel',
                },
                {
                    isGroup: false,
                    name: 'SubGroup1Label',
                },
                {
                    isGroup: false,
                    name: 'SubGroup2Label',
                },
                {
                    isGroup: true,
                    name: 'MyLabelGroup',
                    parent: null,
                    members: ['GroupLabel'],
                },
                {
                    isGroup: true,
                    name: 'SubGroup1',
                    parent: 'MyLabelGroup',
                    members: ['SubGroup1Label'],
                },
                {
                    isGroup: true,
                    name: 'SubGroup2',
                    parent: 'MyLabelGroup',
                    members: ['SubGroup2Label'],
                },
            ];

            const result = resolveGroupMembers(labels, true);
            expect(result.size).toBe(4);
            expect(result.get('*').size).toBe(4);
            expect(result.get('MyLabelGroup').size).toBe(2);
            expect(result.get('SubGroup1').size).toBe(0);
            expect(result.get('SubGroup2').size).toBe(0);
        });

        test('rovLabels should resolve correctly into 5 sets', () => {
            const result = resolveGroupMembers(ROV_LABELS);
            expect(result.size).toBe(5);
            expect(result.get('*').size).toBe(7);
            expect(result.get('VehicleType').size).toBe(2);
            expect(result.get('OperatingModes').size).toBe(5);
            expect(result.get('FaultyModes').size).toBe(2);
            expect(result.get('NominalModes').size).toBe(3);
        });
    });
});
