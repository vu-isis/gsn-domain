/* globals beforeAll, test, describe, expect */
import modelUtils from '../../src/components/graph/modelUtils';
import GSN_CONSTANTS from '../../src/components/graph/GSN_CONSTANTS';
import model from '../../src/examples/control_system';

const nodeMap = modelUtils.getIdToNodeMap(model);

const { SOLVED_BY, IN_CONTEXT_OF } = GSN_CONSTANTS.RELATION_TYPES;
const { LOGICAL_SYMBOLS } = GSN_CONSTANTS;

test('getModelIdForConnNode should return a parseable id', () => {
    const connId = modelUtils.getModelIdForConnNode('parent', SOLVED_BY, 'child');
    expect(typeof connId).toBe('string');
    const { id, srcId, dstId, name, type } = modelUtils.tryParseModelIdOfConn(connId);
    expect(srcId).toBe('parent');
    expect(type).toBe(SOLVED_BY);
    expect(dstId).toBe('child');
    expect(name).toBe('');
    expect(id).toBe(connId);
});

test('tryParseModelIdOfConn should return null if type not recognized', () => {
    expect(modelUtils.tryParseModelIdOfConn('hey-yo-hey')).toBeNull();
    expect(modelUtils.tryParseModelIdOfConn('heyhey')).toBeNull();

    const connId = modelUtils.getModelIdForConnNode('parent', IN_CONTEXT_OF, 'child');
    expect(modelUtils.tryParseModelIdOfConn(connId)).not.toBeNull();
});

test('getChildIds should not include context nodes nor edges if not requested', () => {
    const { children, edges, idToNode } = modelUtils.getChildIds(model, 'model/G1/G3/S2');
    expect(edges).toMatchObject({});
    expect(Object.keys(children)).toHaveLength(4);

    const { children: childrenIncludingContexts } = modelUtils.getChildIds(model, 'model/G1/G3/S2', idToNode, true);

    expect(Object.keys(childrenIncludingContexts)).toHaveLength(6);
});

test('getChildIds should recursively include context nodes', () => {
    const { children } = modelUtils.getChildIds(model, 'model/G1/G3', null, true);
    expect(Object.keys(children)).toHaveLength(9);
});

test('getParentIds should treat contexts and goal nodes the same', () => {
    const { parents: p1 } = modelUtils.getParentIds(model, 'model/G1/G3/S2/G7');
    const { parents: p2 } = modelUtils.getParentIds(model, 'model/G1/G3/S2/J1');

    expect(Object.keys(p1)).toHaveLength(3);
    expect(Object.keys(p2)).toHaveLength(3);
});

describe('getValidTargets', () => {
    test('returns all nodes of given target types that are not parents, direct children, or the node itself', () => {
        const node = nodeMap['model/G1/G2/S1'];
        const targetTypes = GSN_CONSTANTS.SOLVED_BY_TARGETS[node.type];
        const currentRelations = node[SOLVED_BY];
        const validTargets = modelUtils.getValidTargets(model, node.id, targetTypes, currentRelations).map((n) => n.id);

        expect(validTargets).toHaveLength(3);
        expect(validTargets[0]).toBe('model/G1/G3');
        expect(validTargets[1]).toBe('model/G1/G3/S2/G7');
        expect(validTargets[2]).toBe('model/G1/G3/S2/G8');
    });

    test('returns an empty array when there are no valid targets', () => {
        const node = nodeMap['model/G1/G3/S2/G8/Sn4'];
        const targetTypes = [];
        const currentRelations = node[SOLVED_BY];
        const validTargets = modelUtils.getValidTargets(model, node.id, targetTypes, currentRelations);

        expect(validTargets).toMatchObject([]);
    });

    test('sorts the valid targets using the provided sorting function', () => {
        const node = nodeMap['model/G1/G2/S1'];
        const targetTypes = GSN_CONSTANTS.SOLVED_BY_TARGETS[node.type];
        const currentRelations = node[SOLVED_BY];
        const sorter = (n1, n2) => n2.id.localeCompare(n1.id); // Sort nodes in reverse alphabetical order
        const validTargets = modelUtils
            .getValidTargets(model, node.id, targetTypes, currentRelations, sorter)
            .map((n) => n.id);

        expect(validTargets).toHaveLength(3);
        expect(validTargets[0]).toBe('model/G1/G3/S2/G8');
        expect(validTargets[1]).toBe('model/G1/G3/S2/G7');
        expect(validTargets[2]).toBe('model/G1/G3');
    });

    test('throws an error when a non-existent node ID is provided', () => {
        const nodeId = 'non-existent-node';
        const targetTypes = ['Background', 'Context', 'Decision', 'Evidence', 'Goal', 'Strategy', 'Solution'];

        expect(() => modelUtils.getValidTargets(model, nodeId, targetTypes, [])).toThrow();
    });
});

