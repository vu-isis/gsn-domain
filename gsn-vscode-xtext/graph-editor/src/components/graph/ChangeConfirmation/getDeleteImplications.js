/* eslint-disable no-restricted-syntax */
import GSN_CONSTANTS from '../GSN_CONSTANTS';

const { SOLVED_BY, IN_CONTEXT_OF } = GSN_CONSTANTS.RELATION_TYPES;

export function getParentId(nodeId) {
    const paths = nodeId.split('/');
    paths.pop();
    return paths.join('/');
}

export function isParent(nodeId, childId) {
    return getParentId(childId) === nodeId;
}

export function isReference(nodeId, childId) {
    return !isParent(nodeId, childId);
}

export function getContainedChildrenIds(nodeId, nodes) {
    let res = [];

    function traverseRec(id) {
        const node = nodes[id];

        const childrenIds = (node[IN_CONTEXT_OF] || [])
            .concat(node[SOLVED_BY] || [])
            .filter((childId) => !isReference(id, childId));

        res = res.concat(childrenIds);
        childrenIds.forEach((childId) => traverseRec(childId));
    }

    traverseRec(nodeId);

    res.reverse();

    return res;
}

function getReferrers(nodeId, model) {
    const res = [];

    for (const parentNode of model) {
        for (const childId of parentNode[IN_CONTEXT_OF] || []) {
            if (childId === nodeId && isReference(parentNode.id, childId)) {
                res.push({ id: parentNode.id, relationType: IN_CONTEXT_OF });
            }
        }

        for (const childId of parentNode[SOLVED_BY] || []) {
            if (childId === nodeId && isReference(parentNode.id, childId)) {
                res.push({ id: parentNode.id, relationType: SOLVED_BY });
            }
        }
    }

    return res;
}

export const CMDS = {
    ON_REMOVE_CHILD_REF: 'onRemoveChildRef',
    ON_DELETE_NODE: 'onDeleteNode',
};

export default function getDeleteImplications(nodeId, model) {
    let changes = [];
    const nodes = {};
    model.forEach((n) => {
        nodes[n.id] = n;
    });

    const node = nodes[nodeId];

    const children = getContainedChildrenIds(nodeId, nodes);

    children.forEach((childId) => {
        changes = changes.concat(
            getReferrers(childId, model)
                .map(({ id, relationType }) => ({
                    cmd: CMDS.ON_REMOVE_CHILD_REF,
                    nodeId: id,
                    relationType,
                    childId,
                }))
                .filter(({ nodeId: referrerId }) => !children.includes(referrerId) && referrerId !== nodeId)
        );
        changes.push({ cmd: CMDS.ON_DELETE_NODE, nodeId: childId, nodeType: nodes[childId].type });
    });

    changes = changes.concat(
        getReferrers(nodeId, model).map(({ id, relationType }) => ({
            cmd: CMDS.ON_REMOVE_CHILD_REF,
            nodeId: id,
            relationType,
            childId: nodeId,
        }))
    );

    changes.push({ cmd: CMDS.ON_DELETE_NODE, nodeId, nodeType: node.type });

    return changes;
}
