import dagre from 'dagre';
// utils
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import modelUtils from '../modelUtils';

const { IN_CONTEXT_OF } = GSN_CONSTANTS.RELATION_TYPES;

export function getGraphElements(data, addGraphNode, addGraphEdge) {
    const nodeMap = {};
    const nonRootIds = new Set();
    let maxDepth = 0;
    data.forEach((n) => {
        nodeMap[n.id] = n;
        modelUtils.iterateOverRelations(n, ({ childId }) => {
            nonRootIds.add(childId);
        });
    });

    const traverseRec = (node, nodeId, parentId, depth) => {
        maxDepth = depth > maxDepth ? depth : maxDepth;

        const inContextOf = [];
        const solvedBy = [];
        // Gather these before calling the callback.
        modelUtils.iterateOverRelations(node, ({ relationType, childId }) => {
            const childNode = nodeMap[childId];
            if (!childNode) {
                // The case where some nodes are filtered out.
                return;
            }

            const id = `${childId}--ownedBy--${nodeId}`;

            if (relationType === IN_CONTEXT_OF) {
                inContextOf.push(id);
            } else {
                solvedBy.push(id);
            }
        });

        addGraphNode(node, nodeId, parentId, solvedBy, inContextOf, depth);

        modelUtils.iterateOverRelations(node, ({ relationType, childId }) => {
            const childNode = nodeMap[childId];
            if (!childNode) {
                // The case where some nodes are filtered out.
                return;
            }

            const id = `${childId}--ownedBy--${nodeId}`;

            const connId = modelUtils.getModelIdForConnNode(nodeId, relationType, id);
            const modelId = modelUtils.getModelIdForConnNode(node.id, relationType, childId);

            addGraphEdge({
                id: connId,
                type: relationType,
                modelId,
                source: relationType === IN_CONTEXT_OF ? id : nodeId,
                target: relationType === IN_CONTEXT_OF ? nodeId : id,
            });

            traverseRec(childNode, id, nodeId, depth + 1);
        });
    };

    data.forEach((node) => {
        // Traverse recursively starting at roots.
        if (nonRootIds.has(node.id)) {
            return;
        }

        traverseRec(node, node.id, null, 1);
    });

    return maxDepth;
}

export function getLayoutedElements(nodes, edges, direction = 'TB', nodeWidth = 180, nodeHeight = 200) {
    // const dt = Date.now();
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    const nodeIds = new Set();

    nodes.forEach((node) => {
        if (node.hidden) return;
        nodeIds.add(node.id);
        dagreGraph.setNode(node.id, { width: node.data.width || nodeWidth, height: node.data.height || nodeHeight });
    });

    edges.forEach((edge) => {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            edge.hidden = true;
            return;
        }

        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        if (node.hidden) return;
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    // console.log('Time to compute graph layout ', Date.now() - dt, '[ms]');
    return { nodes, edges };
}
