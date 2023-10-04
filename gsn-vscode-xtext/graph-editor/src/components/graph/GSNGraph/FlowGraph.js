/* eslint-disable no-debugger */
/* eslint-disable no-restricted-syntax */
import PropTypes from 'prop-types';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { toSvg } from 'html-to-image';
import ReactFlow, {
    Background,
    ConnectionLineType,
    MiniMap,
    Controls,
    ControlButton,
    useReactFlow,
    getRectOfNodes,
} from 'reactflow';
import {
    Image as ImageIcon,
    UnfoldLess as UnfoldLessIcon,
    UnfoldMore as UnfoldMoreIcon,
    RawOff as RawOffIcon,
    RawOn as RawOnIcon,
    Label as LabelIcon,
    LabelOff as LabelOffIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
// components
import { Nodes, Edges, Markers } from './FlowComponents';
import FlowContext from './FlowContext';
// utils
import usePrevious from '../hooks/usePrevious';
import { COLORS } from '../theme';
import { getGraphElements, getLayoutedElements } from './graphUtils';

import 'reactflow/dist/style.css';
import './flowTheme.css';
import GSN_CONSTANTS from '../GSN_CONSTANTS';

const SOLVED_BY_EXPANDED_DIVISOR = 2;
const IN_CONTEXT_OF_EXPANDED_DIVISOR = 3;

FlowGraph.propTypes = {
    data: PropTypes.array.isRequired,
    filter: PropTypes.shape({
        expandAll: PropTypes.bool,
        highlighted: PropTypes.object,
    }),
    minZoom: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    left: PropTypes.number,
    top: PropTypes.number,
    nonReactive: PropTypes.bool,
    selectedNode: PropTypes.oneOfType([
        PropTypes.shape({
            nodeId: PropTypes.string,
            treeId: PropTypes.string,
        }),
        PropTypes.arrayOf(PropTypes.string),
    ]),
    setSelectedNode: PropTypes.func,
    onConnectNodes: PropTypes.func,
    showReferencesAtStart: PropTypes.bool,
};

function computeElements(data, onExpandNode, expanded, expandAll, nonReactive) {
    // const dt = Date.now();
    const nodes = new Map();
    const edges = [];

    function addGraphNode(node, id, parentId, solvedBy, inContextOf) {
        const expandNumber = expanded[id] || 1;
        const nodeData = {
            id,
            parentId,
            position: { x: 0, y: 0 },
            type: node.type,
            data: {
                node,
                modelId: node.id,
                onExpand: nonReactive ? null : onExpandNode,
                isExpanded: expandAll || expandNumber % SOLVED_BY_EXPANDED_DIVISOR === 0,
                contextsExpanded: expandAll || expandNumber % IN_CONTEXT_OF_EXPANDED_DIVISOR === 0,
                solvedBy,
                inContextOf,
            },
        };

        nodes.set(id, nodeData);
    }

    function addGraphEdge({ id, source, target, modelId, type }) {
        const edgeData = {
            id,
            source,
            target,
            type,
            data: {
                modelId,
            },
        };

        edges.push(edgeData);
    }

    getGraphElements(data, addGraphNode, addGraphEdge);
    nodes.forEach((node) => {
        if (nonReactive) {
            return;
        }

        let { parentId } = node;

        if (GSN_CONSTANTS.CONTEXT_NODES.includes(node.type) && parentId) {
            // Special case for context nodes.

            // First parent must have contexts expanded ...
            const parentNode = nodes.get(parentId);
            if (!parentNode.data.contextsExpanded) {
                node.hidden = true;
                return;
            }
            // .. and be expanded itself (resolved in while loop as with other nodes).
            ({ parentId } = parentNode);
        }

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (!parentId) {
                node.hidden = false;
                return;
            }

            const parentNode = nodes.get(parentId);
            if (parentNode.hidden || !parentNode.data.isExpanded) {
                node.hidden = true;
                return;
            }

            ({ parentId } = parentNode);
        }
    });

    // console.log('Time to build graph nodes ', Date.now() - dt, '[ms]');
    return getLayoutedElements([...nodes.values()], edges, 'TB');
}

const ensureGraphNodeVisiblyExpanded = (expandedNodes, treeIdToGraphNode, treeId) => {
    let changesMade = false;

    let treeNode = treeIdToGraphNode[treeId];

    let { parentId } = treeNode;

    while (parentId) {
        const isContextNode = GSN_CONSTANTS.CONTEXT_NODES.includes(treeNode.type);
        changesMade = setNodeToExpanded(expandedNodes, parentId, isContextNode) || changesMade;
        treeNode = treeIdToGraphNode[parentId];
        parentId = treeNode?.parentId;
    }

    return changesMade;
};

const setNodeToExpanded = (expandedNodes, treeId, isInContextOf) => {
    const divisor = isInContextOf ? IN_CONTEXT_OF_EXPANDED_DIVISOR : SOLVED_BY_EXPANDED_DIVISOR;
    if (!expandedNodes[treeId]) {
        expandedNodes[treeId] = 1;
    }

    if (expandedNodes[treeId] % divisor !== 0) {
        expandedNodes[treeId] *= divisor;
        return true;
    }

    return false;
};

const setNodeToCollapsed = (expandedNodes, treeId, isInContextOf) => {
    const divisor = isInContextOf ? IN_CONTEXT_OF_EXPANDED_DIVISOR : SOLVED_BY_EXPANDED_DIVISOR;
    if (!expandedNodes[treeId]) {
        expandedNodes[treeId] = 1;
    }

    if (expandedNodes[treeId] % divisor === 0) {
        // Collapse and the node was expanded.
        expandedNodes[treeId] /= divisor;
        return true;
    }

    return false;
};

export default function FlowGraph({
    data,
    filter,
    width,
    height,
    left = 0,
    top = 0,
    nonReactive,
    selectedNode = { nodeId: null, treeId: null },
    setSelectedNode,
    minZoom = 0,
    showReferencesAtStart = false,
    onConnectNodes,
}) {
    const themeMode = useTheme().palette.mode;
    const [uniqueClass] = useState(`flow_graph__${crypto.randomUUID()}`);
    const [expanded, setExpanded] = useState({});
    const prevExpanded = usePrevious(expanded);
    const reactFlowInstance = useReactFlow();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [expandAll, setExpandAll] = useState(Boolean(nonReactive));
    const [showReferences, setShowReferences] = useState(showReferencesAtStart);
    const [showLabels, setShowLabels] = useState(false);
    const [highlightedNodes, setHighlightedNodes] = useState(filter && filter.highlighted ? filter.highlighted : null);

    const flowContext = useMemo(() => {
        const selectedNodes = new Set();

        if (selectedNode instanceof Array) {
            selectedNode.forEach((nodeId) => selectedNodes.add(nodeId));
        } else if (selectedNode.nodeId) {
            selectedNodes.add(selectedNode.nodeId);
        }

        return {
            selectedNodes,
            searchString: '', // Not used anymore
            showReferences,
            nonReactive,
            highlightedNodes,
            showLabels,
            themeMode,
        };
    }, [selectedNode, showReferences, nonReactive, highlightedNodes, showLabels, themeMode]);

    useEffect(() => {
        if (selectedNode instanceof Array || !selectedNode.nodeId) {
            return;
        }

        const treeIdToGraphNode = {};
        const treeIds = [];
        nodes.forEach((treeNode) => {
            treeIdToGraphNode[treeNode.id] = treeNode;
            // Only model id given -> find all treeNodes and expand them.
            if (!selectedNode.treeId && treeNode.data.modelId === selectedNode.nodeId) {
                treeIds.push(treeNode.id);
            }
        });

        if (selectedNode.treeId) {
            if (!treeIdToGraphNode[selectedNode.treeId]) {
                // This is an edge node..
                return;
            }

            // The only treeId in question - put it in the array.
            treeIds.push(selectedNode.treeId);
        }

        const newExpanded = { ...expanded };
        let hadChanges = false;

        treeIds.forEach((treeId) => {
            hadChanges = hadChanges || ensureGraphNodeVisiblyExpanded(newExpanded, treeIdToGraphNode, treeId);
        });

        if (hadChanges) {
            setExpanded(newExpanded);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode]);

    useEffect(() => {
        const elements = computeElements(data, onExpandNode, expanded, expandAll, nonReactive);
        // use previous nodes
        const rect = getRectOfNodes(nodes);
        const nodeDiff = Math.abs(elements.nodes.length - nodes.length);
        // TODO: If it gets sluggish - we can compare the new elements with the old and only update changed ones.
        setNodes(elements.nodes);
        setEdges(elements.edges);

        if (expanded !== prevExpanded) {
            const zoom = reactFlowInstance.getZoom();
            const canvasHeight = Math.floor(height / zoom);
            const canvasWidth = Math.floor(width / zoom);
            // Only resize when the current model is fitted within canvas.
            if (rect.width < canvasWidth && rect.height < canvasHeight) {
                setTimeout(() => reactFlowInstance.fitView({ duration: 400 }), 100);
            }
        }

        if (nonReactive && flowContext.selectedNodes.size > 0) {
            setTimeout(() => {
                const filtered = reactFlowInstance
                    .getNodes()
                    .filter((n) => flowContext.selectedNodes.has(n.data.modelId));
                reactFlowInstance.fitView({
                    duration: 1000,
                    nodes: filtered,
                });
            }, 500);
        } else if (nodeDiff > 10) {
            setTimeout(() => reactFlowInstance.fitView({ duration: 400 }), 100);
        }

        // We only need access to prevExpanded during this effect, but don't want to recalculate the nodes
        // when it changes. https://blog.bitsrc.io/understanding-dependencies-in-useeffect-7afd4df37c96
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, expanded, reactFlowInstance, nonReactive, expandAll]);

    useEffect(() => {
        if (!filter) {
            setHighlightedNodes(null);
            return;
        }

        if (filter.expandAll) {
            expandCollapseAll(true);
        }

        if (filter.highlighted) {
            setHighlightedNodes(filter.highlighted);
        } else {
            setHighlightedNodes(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const onExpandNode = useCallback(
        (treeId, doExpand, isInContextOf, applyToSubTree) => {
            const newExpanded = { ...expanded };

            if (doExpand) {
                setNodeToExpanded(newExpanded, treeId, isInContextOf);
            } else {
                setNodeToCollapsed(newExpanded, treeId, isInContextOf);
            }

            if (applyToSubTree) {
                const nodes = reactFlowInstance.getNodes();

                const expandChildrenRec = (node) => {
                    node.data.solvedBy.forEach((childId) => {
                        if (doExpand) {
                            setNodeToExpanded(newExpanded, childId, isInContextOf);
                        } else {
                            setNodeToCollapsed(newExpanded, childId, isInContextOf);
                        }

                        expandChildrenRec(nodes.find((n) => n.id === childId));
                    });
                };

                expandChildrenRec(nodes.find((n) => n.id === treeId));
            }

            setExpanded(newExpanded);
            if (expandAll && doExpand === false) {
                setExpandAll(false);
            }
        },
        [expanded, reactFlowInstance, expandAll]
    );

    const expandCollapseAll = useCallback(
        (doExpand) => {
            const newExpanded = {};
            reactFlowInstance.getNodes().forEach((node) => {
                if (doExpand) {
                    setNodeToExpanded(newExpanded, node.id, true);
                    setNodeToExpanded(newExpanded, node.id, false);
                } else {
                    setNodeToCollapsed(newExpanded, node.id, true);
                    setNodeToCollapsed(newExpanded, node.id, false);
                }
            });

            setExpanded(newExpanded);
        },
        [reactFlowInstance]
    );

    const onElementClick = useCallback(
        (_, elem) => {
            if (nonReactive) return;

            setSelectedNode({ nodeId: elem.data.modelId, treeId: elem.id });
        },
        [setSelectedNode, nonReactive]
    );

    const onConnect = useCallback(
        (eventData) => {
            if (nonReactive) {
                return;
            }

            const sourceNode = nodes.find((n) => n.id === eventData.source);
            const targetNode = nodes.find((n) => n.id === eventData.target);
            if (!sourceNode || !targetNode) {
                console.error('Source and/or target missing', sourceNode, targetNode, eventData);
                return;
            }

            let sourceId = sourceNode.data.modelId;
            let targetId = targetNode.data.modelId;

            if (
                GSN_CONSTANTS.CONTEXT_NODES.includes(sourceNode.type) ||
                GSN_CONSTANTS.CONTEXT_NODES.includes(targetNode.type)
            ) {
                // InContextOfs are rendered in reverse.
                sourceId = targetNode.data.modelId;
                targetId = sourceNode.data.modelId;
            }

            onConnectNodes(sourceId, targetId);
        },
        [nonReactive, onConnectNodes, nodes]
    );

    const onNodeDoubleClick = useCallback(
        (_, elem) => {
            console.log('Clicked node', JSON.stringify(elem, null, 2));
            let info = { LEAF_NODES: 0 };
            const nodeIdToParent = {};
            nodes.forEach((n) => {
                nodeIdToParent[n.id] = n.parentId;
            });

            const atNode = (n) => {
                if (!info[n.type]) {
                    info[n.type] = 0;
                }

                info[n.type] += 1;
                if (typeof n.data === 'object') {
                    if (n.data.solvedBy.length === 0) {
                        info.LEAF_NODES += 1;
                    }
                    let depth = 1;
                    let { parentId } = n;
                    while (parentId) {
                        depth += 1;
                        parentId = nodeIdToParent[parentId];
                    }

                    info.MAX_DEPTH = depth > info.MAX_DEPTH ? depth : info.MAX_DEPTH;
                } else if (
                    !n[GSN_CONSTANTS.RELATION_TYPES.SOLVED_BY] ||
                    n[GSN_CONSTANTS.RELATION_TYPES.SOLVED_BY].length === 0
                ) {
                    info.LEAF_NODES += 1;
                }
            };

            data.forEach(atNode);
            console.log('Node count [excluding refs]', JSON.stringify(info, null, 2));
            info = { LEAF_NODES: 0, MAX_DEPTH: 1 };
            nodes.forEach(atNode);
            console.log('Node count [including refs]', JSON.stringify(info, null, 2));
        },
        [nodes, data]
    );

    const onPaneClick = useCallback(() => {
        if (nonReactive) return;

        setSelectedNode({ nodeId: null, treeId: null });
    }, [setSelectedNode, nonReactive]);

    const onExportToImage = useCallback(() => {
        toSvg(document.querySelector(`.${uniqueClass}`), {
            filter: (node) => {
                if (!node || !node.classList) {
                    return true;
                }

                if (
                    node.classList.contains('react-flow__minimap') ||
                    node.classList.contains('react-flow__controls') ||
                    node.classList.contains('react-flow__background') ||
                    node.classList.contains('react-flow__attribution') ||
                    node.classList.contains('do-not-print')
                ) {
                    return false;
                }

                return true;
            },
        }).then((dataUrl) => {
            const a = document.createElement('a');
            a.setAttribute('download', 'reactflow.svg');
            a.setAttribute('href', dataUrl);
            a.click();
        });
    }, [uniqueClass]);

    if (width <= 0 || height <= 0) {
        return null;
    }

    if (reactFlowInstance) {
        // console.log(reactFlowInstance.getZoom());
    }

    return (
        <div
            className={uniqueClass}
            style={{
                width,
                height,
                left: left > 0 ? left : undefined,
                top: top > 0 ? top : undefined,
                position: left + top > 0 ? 'absolute' : undefined,
            }}
        >
            <FlowContext.Provider value={flowContext}>
                <Markers />
                <ReactFlow
                    style={{ backgroundColor: COLORS.FLOW.background[themeMode] }}
                    className={`react-flow_${themeMode}`}
                    elementsSelectable={false}
                    selectNodesOnDrag={false}
                    minZoom={minZoom}
                    zoomOnScroll={!nonReactive}
                    zoomOnDoubleClick={!nonReactive}
                    panOnDrag={!nonReactive}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={Nodes}
                    edgeTypes={Edges}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    onConnect={onConnect}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onNodeClick={onElementClick}
                    onEdgeClick={onElementClick}
                    onPaneClick={onPaneClick}
                    fitView
                >
                    {nonReactive ? null : <Background color="#aaa" />}
                    {nonReactive ? null : (
                        <>
                            <Controls position="bottom-left" showInteractive={false}>
                                <ControlButton
                                    title={`${
                                        expandAll ? 'collapse and turn-off' : 'expand and turn-on'
                                    } expand-all nodes`}
                                    onClick={() => {
                                        expandCollapseAll(!expandAll);
                                        setExpandAll(!expandAll);
                                    }}
                                >
                                    {expandAll ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                                </ControlButton>
                                <ControlButton
                                    title={`${showReferences ? 'hide' : 'show'} reference indicators`}
                                    onClick={() => {
                                        setShowReferences(!showReferences);
                                    }}
                                >
                                    {showReferences ? <RawOffIcon /> : <RawOnIcon />}
                                </ControlButton>
                                <ControlButton
                                    title={`${showLabels ? 'hide' : 'show'} labels`}
                                    onClick={() => {
                                        setShowLabels(!showLabels);
                                    }}
                                >
                                    {showLabels ? <LabelOffIcon /> : <LabelIcon />}
                                </ControlButton>
                                <ControlButton title="export to svg" onClick={onExportToImage}>
                                    <ImageIcon />
                                </ControlButton>
                            </Controls>
                            <MiniMap zoomable pannable position="top-left" nodeColor={({ type }) => COLORS[type]} />
                        </>
                    )}
                </ReactFlow>
            </FlowContext.Provider>
        </div>
    );
}
