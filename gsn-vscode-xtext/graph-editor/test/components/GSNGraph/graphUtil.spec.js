/* globals test, expect */
import { getLayoutedElements } from '../../../src/components/graph/GSNGraph/graphUtils';

test('getLayoutedElements should support loops', () => {
    const inputNodes = [
        {
            id: 'A',
            data: {},
        },
        {
            id: 'B',
            data: {},
        },
        {
            id: 'C',
            data: {},
        },
    ];

    const inputEdges = [
        {
            source: 'A',
            target: 'B',
        },
        {
            source: 'B',
            target: 'C',
        },
        {
            source: 'C',
            target: 'A',
        },
    ];
    const { nodes } = getLayoutedElements(inputNodes, inputEdges, 'LR', 10, 10);

    const aPos = nodes.find((n) => n.id === 'A').position;
    const bPos = nodes.find((n) => n.id === 'B').position;
    const cPos = nodes.find((n) => n.id === 'C').position;

    // Should be deterministic
    expect(aPos.x).toBe(0);
    expect(aPos.y).toBe(20);
    expect(bPos.x).toBe(60);
    expect(bPos.y).toBe(0);
    expect(cPos.x).toBe(120);
    expect(cPos.y).toBe(20);
});
