/* eslint-disable no-restricted-syntax */
import GSN_CONSTANTS from './GSN_CONSTANTS';

const { SOLVED_BY, IN_CONTEXT_OF } = GSN_CONSTANTS.RELATION_TYPES;

/**
 * Generates a unique name for a child element.
 *
 * @param {string} prefix - The prefix to use for the child element name.
 * @param {string[]} existingNames - An array of existing names to check against to ensure uniqueness.
 * @returns {string} - A string representing the unique name for the child element.
 */
const generateUniqueChildName = (prefix, existingNames) => {
    let cnt = 1;
    let newName = `${prefix}${cnt}`;
    while (existingNames.includes(newName)) {
        cnt += 1;
        newName = `${prefix}${cnt}`;
    }

    return newName;
};

/**
 * Returns a map that maps each node ID to its corresponding node object.
 *
 * @param {object[]} model - An array of node objects.
 * @returns {object} - An object where the keys are node IDs and the values are node objects.
 */
const getIdToNodeMap = (model) => {
    const idToNode = {};
    model.forEach((node) => {
        idToNode[node.id] = node;
    });
    return idToNode;
};

/**
 * Generates a unique ID for a connection between two nodes.
 *
 * @param {string} srcId - The ID of the source node.
 * @param {string} type - The type of connection (e.g., "input" or "output").
 * @param {string} dstId - The ID of the destination node.
 * @returns {string} - A string representing the unique ID for the connection.
 */
const getModelIdForConnNode = (srcId, type, dstId) => `${srcId}-${type}-${dstId}`;

/**
 * Tries to parse a connection ID and return its component parts.
 *
 * @param {string} connId - The ID of the connection to parse.
 * @returns {?object} - An object containing the parsed connection information or null if parsing failed.
 *                      The returned object has the following properties:
 *                        - type: The type of connection (e.g., "input" or "output").
 *                        - srcId: The ID of the source node.
 *                        - dstId: The ID of the destination node.
 *                        - id: The original connection ID.
 *                        - name: An optional name for the connection.
 *                      If parsing failed, null is returned.
 */
const tryParseModelIdOfConn = (connId) => {
    const connTypes = Object.keys(GSN_CONSTANTS.RELATION_TYPES).map((key) => GSN_CONSTANTS.RELATION_TYPES[key]);

    for (const type of connTypes) {
        const srcAndDst = connId.split(`-${type}-`);
        if (srcAndDst.length === 2) {
            return { type, srcId: srcAndDst[0], dstId: srcAndDst[1], id: connId, name: '' };
        }
    }

    return null;
};

/**
 *
 * @param {object} node - the node that owns the relations
 * @param {function({relationType: string, childId: string})} atLink - visitor invoked with relationType and childId.
 */
const iterateOverRelations = (node, atLink) => {
    [SOLVED_BY, IN_CONTEXT_OF].forEach((relationType) => {
        (node[relationType] || []).forEach((childId) => atLink({ relationType, childId }));
    });
};

/**
 * Recursively traverses the children of a given node and returns their IDs, along with the IDs of any context nodes
 * or edges connecting them, depending on the provided options.
 *
 * @param {object[]} model - The model array containing all nodes and connections.
 * @param {string} nodeId - The ID of the node whose children to traverse.
 * @param {?object} [idToNode=null] - An optional dictionary mapping node IDs to their corresponding node objects.
 *                                    If not provided, it will be generated from the model array.
 * @param {boolean} [includeContextNodes=false] - Whether to include the IDs of any context nodes that the children are within.
 * @param {boolean} [collectEdges=false] - Whether to include the IDs of any edges connecting the children to the given node.
 * @returns {object} - An object containing the IDs of the children and any edges, as well as the idToNode dictionary.
 *                     The returned object has the following properties:
 *                       - children: A dictionary mapping child node IDs to `true`.
 *                       - edges: A dictionary mapping connection IDs to `true`.
 *                       - idToNode: A dictionary mapping node IDs to their corresponding node objects.
 */
const getChildIds = (model, nodeId, idToNode = null, includeContextNodes = false, collectEdges = false) => {
    // Build dictionary if not provided.
    if (!idToNode) {
        idToNode = getIdToNodeMap(model);
    }

    const res = {
        children: {},
        idToNode,
        edges: {},
    };

    function traverseChildrenRec(id) {
        if (!idToNode[id]) {
            // Child might be filtered out..
            return;
        }

        const contextOfs = idToNode[id][IN_CONTEXT_OF];
        const solvedBys = idToNode[id][SOLVED_BY] || [];

        if (includeContextNodes && contextOfs) {
            contextOfs.forEach((id) => {
                res.children[id] = true;
            });
        }

        for (const childId of solvedBys) {
            res.children[childId] = true;
            if (collectEdges) {
                res.edges[getModelIdForConnNode(id, SOLVED_BY, childId)] = true;
            }
            traverseChildrenRec(childId);
        }
    }

    traverseChildrenRec(nodeId);

    return res;
};

/**
 * Recurisvely gets the parent node IDs of a given node in the model.
 *
 * @param {object[]} model - The GSN model.
 * @param {string} nodeId - The ID of the node for which to retrieve the parent IDs.
 * @param {?object} [idToNode=null] - An optional dictionary mapping node IDs to their corresponding node objects.
 *                                    If not provided, it will be generated from the model array.
 * @returns {object} - An object containing the IDs of the parents, as well as the idToNode dictionary.
 *                     The returned object has the following properties:
 *                       - parents: A dictionary mapping parent node IDs to `true`.
 *                       - idToNode: A dictionary mapping node IDs to their corresponding node objects.
 */
const getParentIds = (model, nodeId, idToNode = null) => {
    // Build dictionary if not provided.
    if (!idToNode) {
        idToNode = getIdToNodeMap(model);
    }

    const res = {
        parents: {},
        idToNode,
    };

    function traverseParentsRec(id) {
        const parentIds = model.filter((n) => (n[SOLVED_BY] || []).includes(id)).map((n) => n.id);

        for (const parentId of parentIds) {
            if (!res.parents[parentId]) {
                res.parents[parentId] = true;
                traverseParentsRec(parentId);
            }
        }
    }

    if (GSN_CONSTANTS.CONTEXT_NODES.includes(idToNode[nodeId].type)) {
        const parents = model.filter((n) => (n[IN_CONTEXT_OF] || []).includes(nodeId));

        parents.forEach((pNode) => {
            res.parents[pNode.id] = true;
            traverseParentsRec(pNode.id);
        });
    } else {
        traverseParentsRec(nodeId);
    }

    return res;
};

/**
 * Gets a list of valid target nodes for a new relation from the given node, filtering out current relations and parents of the given node.
 *
 * @param {object[]} model - The GSN model.
 * @param {string} nodeId - The ID of the node for which to retrieve valid targets.
 * @param {string[]} targetTypes - Array of node types to consider as valid targets.
 * @param {string[]} currentRelations - Array of node IDs representing the current relations of the given node.
 * @param {function(object,object)} [sorter=null] - Optional sorting function for the resulting list of nodes.
 * @returns {object[]} An array of node objects representing the valid targets.
 */
const getValidTargets = (model, nodeId, targetTypes, currentRelations, sorter = null) => {
    const sortById = (n1, n2) => n1.id.localeCompare(n2.id);
    const { parents } = modelUtils.getParentIds(model, nodeId);

    return model
        .filter((node) => {
            if (!targetTypes.includes(node.type)) {
                return false;
            }
            // ASSUMPTION: Target cannot be a parent, direct child or the node itself.
            const nId = node.id;
            return !(parents[nId] || currentRelations.includes(nId) || nId === nodeId);
        })
        .sort(sorter || sortById);
};

/**
 * @typedef {object} ValidTargetResult
 * @property {string} isValid - Indicates whether the target node can be linked to the given node.
 * @property {string|null} relationType - The type of the relation to create if the target is valid.
 * @property {string|null} message - A message providing additional information if the target cannot be linked.
 */

/**
 * Checks if a target node can be linked to a given node based on certain criteria.
 *
 * @param {object[]} model - The GSN model.
 * @param {string} nodeId - The ID of the node to be linked to the target node.
 * @param {string} targetId - The ID of the target node to be linked with the given node.
 *
 * @returns {ValidTargetResult} - An object containing information about the validity.
 *
 * The function evaluates the following criteria for linking nodes:
 *  1. A node cannot be linked to itself.
 *  2. Nodes can only be linked according to the rules defined by GSN_CONSTANTS.
 *  3. Nodes cannot be linked more than once.
 *  4. Nodes cannot be linked to their parent nodes.
 */
const isValidTarget = (model, nodeId, targetId) => {
    const result = {
        isValid: false,
        relationType: null,
        message: null,
    };

    if (nodeId === targetId) {
        result.message = 'Node cannot be linked to itself.';
        return result;
    }

    const idToNode = getIdToNodeMap(model);
    const node = idToNode[nodeId];
    if (!node) {
        result.message = 'Something went wrong - could not obtain node in model.';
        return result;
    }

    const targetNode = model.find((n) => n.id === targetId);
    if (!targetNode) {
        result.message = 'Something went wrong - could not obtain target in model.';
        return result;
    }

    const isInContextOf = GSN_CONSTANTS.CONTEXT_NODES.includes(targetNode.type);

    if (isInContextOf) {
        if (
            !GSN_CONSTANTS.IN_CONTEXT_OF_OWNERS.includes(node.type) ||
            !GSN_CONSTANTS.IN_CONTEXT_OF_TARGETS[node.type].includes(targetNode.type)
        ) {
            result.message = `Node cannot link to ${targetNode.type} nodes.`;
            return result;
        }

        if ((node[IN_CONTEXT_OF] || []).includes(targetId)) {
            result.message = 'Target is already linked with node.';
            return result;
        }

        result.isValid = true;
        result.relationType = IN_CONTEXT_OF;

        return result;
    }

    if (
        !GSN_CONSTANTS.SOLVED_BY_OWNERS.includes(node.type) ||
        !GSN_CONSTANTS.SOLVED_BY_TARGETS[node.type].includes(targetNode.type)
    ) {
        result.message = `Node cannot link to ${targetNode.type} nodes.`;
        return result;
    }

    if ((node[SOLVED_BY] || []).includes(targetId)) {
        result.message = 'Target is already linked with node.';
        return result;
    }

    const { parents } = modelUtils.getParentIds(model, nodeId, idToNode);

    if (parents[targetId]) {
        result.message = 'Cannot link to parent nodes.';
        return result;
    }

    result.isValid = true;
    result.relationType = SOLVED_BY;

    return result;
};

/**
 * Gets the short GSN name for a type.
 *
 * @param {string} type - The type of the node.
 *
 * @returns {string} - The prefix
 */
const getShortTypeName = (type) => {
    let prefix;

    switch (type) {
        case GSN_CONSTANTS.TYPES.SOLUTION:
            prefix = 'Sn';
            break;
        case GSN_CONSTANTS.TYPES.CHOICE:
            prefix = 'Ch';
            break;
        default:
            prefix = type[0];
            break;
    }

    return prefix;
};

/**
 * Generates a new ID for a node when its name changes.
 *
 * @param {string} nodeId - The original ID of the node.
 * @param {string} newName - The new name for the node.
 * @returns {string} - The new ID for the node.
 */
const getNewIdAtNameChange = (nodeId, newName) => {
    const idParts = nodeId.split('/');
    idParts.pop();
    idParts.push(newName);
    return idParts.join('/');
};

/**
 * Generates new IDs for a node and its children.
 *
 * @param {object[]} model - The GSN model.
 * @param {string} nodeId - The original ID of the node.
 * @param {string} newId - The new ID for the node.
 * @returns {Map<string, string>} - A Map object where keys are old IDs and values are new IDs.
 */
const getNewIdsForNodeAndChildren = (model, nodeId, newId) => {
    const oldIdRegex = new RegExp(`^${nodeId}/`);
    const oldIdsToNew = new Map();

    model.forEach(({ id }) => {
        const newChildId = id.replace(oldIdRegex, `${newId}/`);
        oldIdsToNew.set(id, newChildId);
    });

    oldIdsToNew.set(nodeId, newId);

    return oldIdsToNew;
};

const modelUtils = {
    GSN_CONSTANTS,
    getIdToNodeMap,
    iterateOverRelations,
    getChildIds,
    getParentIds,
    getValidTargets,
    isValidTarget,
    getShortTypeName,
    generateUniqueChildName,
    getModelIdForConnNode,
    getNewIdAtNameChange,
    getNewIdsForNodeAndChildren,
    tryParseModelIdOfConn,
};

export default modelUtils;
