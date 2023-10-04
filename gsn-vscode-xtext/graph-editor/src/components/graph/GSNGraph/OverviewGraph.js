import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import debounce from 'debounce';
import cytoscape from 'cytoscape';
import cise from 'cytoscape-cise';
import popper from 'cytoscape-popper';
import './popper.css';

// @mui
import { FormControl, Radio, RadioGroup, FormControlLabel, FormLabel, Switch } from '@mui/material';
// utils
import usePrevious from '../hooks/usePrevious';
import { getGraphElements } from './graphUtils';
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import { COLORS } from '../theme';

cytoscape.use(cise);
cytoscape.use(popper);
const { IN_CONTEXT_OF } = GSN_CONSTANTS.RELATION_TYPES;
const { TYPES } = GSN_CONSTANTS;
const ZOOM_IN_ON_NODE_PADDING = 320;

OverviewGraph.propTypes = {
    data: PropTypes.array.isRequired,
    filter: PropTypes.shape({
        expandAll: PropTypes.bool,
        highlighted: PropTypes.object,
    }),
    width: PropTypes.number,
    height: PropTypes.number,
    left: PropTypes.number,
    top: PropTypes.number,
    layout: PropTypes.object,
    selectedNode: PropTypes.oneOfType([
        PropTypes.shape({
            nodeId: PropTypes.string,
            treeId: PropTypes.string,
        }),
        PropTypes.arrayOf(PropTypes.string),
    ]),
    setSelectedNode: PropTypes.func,
};

const stylesheet = [
    {
        selector: 'node[name]',
        style: {
            height: 60,
            width: 60,
            'background-color': 'white',
            'border-width': 10,
            label: 'data(name)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'ellipsis',
            'text-max-width': '100%',
            'text-overflow-wrap': 'anywhere',
        },
    },
    {
        selector: `node[type='${TYPES.GOAL}']`,
        style: {
            'border-color': COLORS.Goal,
        },
    },
    {
        selector: `node[type='${TYPES.SOLUTION}']`,
        style: {
            'border-color': COLORS.Solution,
        },
    },
    {
        selector: `node[type='${TYPES.STRATEGY}']`,
        style: {
            'border-color': COLORS.Strategy,
        },
    },
    {
        selector: `node[type='${TYPES.CONTEXT}'], node[type='${TYPES.ASSUMPTION}'], node[type='${TYPES.JUSTIFICATION}']`,
        style: {
            'border-color': COLORS.Context,
        },
    },
    {
        selector: 'node:selected',
        style: {
            height: 80,
            width: 80,
            'background-color': COLORS.SELECTED(false),
        },
    },
    {
        selector: 'edge',
        style: {
            'curve-style': 'bezier',
            // 'curve-style': 'haystack',
            // 'haystack-radius': 0,
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1,
            'target-arrow-color': COLORS.Edge,
            'source-arrow-color': COLORS.Edge,
            width: 1,
            'line-color': COLORS.Edge,
            'source-endpoint': 'outside-to-node',
            'target-endpoint': 'outside-to-node',
        },
    },
    {
        selector: 'edge:selected',
        style: {
            width: 6,
            'line-color': COLORS.SELECTED(false),
            'target-arrow-color': COLORS.SELECTED(false),
            'source-arrow-color': COLORS.SELECTED(false),
            'arrow-scale': 1,
        },
    },
    {
        selector: 'edge[?contextEdge]',
        style: {
            'line-style': 'dashed',
            'target-arrow-shape': 'none',
            'source-arrow-shape': 'triangle',
            'source-arrow-fill': 'hollow',
        },
    },
];

const defaultLayout = {
    name: 'concentric',
    concentric: (node) => node.data('depth'),
    levelWidth: (/* nodes */) => 1,
};

export default function OverviewGraph({
    data,
    width,
    height,
    left,
    top,
    selectedNode,
    setSelectedNode,
    layout = defaultLayout,
}) {
    const cyRef = useRef(null);
    const [viewport, setViewport] = useState(null);
    const prevSelectedNode = usePrevious(selectedNode);
    const [showContextNodes, setShowContextNodes] = useState(true);
    const [clusterDepth, setClusterDepth] = useState(layout.name === 'cise' ? 2 : -1);

    // Build elements
    useEffect(() => {
        if (!cyRef?.current) {
            return;
        }

        const cy = cyRef.current;

        cy.once('layoutstop', () => {
            // console.log('layoutstop');
        });

        // Build map.
        const nodes = [];
        const edges = [];
        const contextNodes = [];
        const contextEdges = [];

        let clusterIdCnt = 2;

        function addGraphNode(node, id, parentId, solvedBy, inContextOf, depth) {
            if (depth === clusterDepth) {
                // Switching cluster
                if (solvedBy.length + inContextOf.length > 0) {
                    // but only if there are children - if not we use the same negative cluster as the parent.
                    clusterIdCnt += 1;
                }
            }

            let clusterId = 0;
            if (depth === 1) {
                clusterId = 1;
            } else if (depth < clusterDepth) {
                clusterId = -clusterIdCnt;
            } else if (depth === clusterDepth && solvedBy.length + inContextOf.length === 0) {
                clusterId = -clusterIdCnt;
            } else {
                clusterId = clusterIdCnt;
            }

            const cyNode = {
                data: {
                    id,
                    depth,
                    assignedDepth: depth,
                    modelId: node.id,
                    type: node.type,
                    name: node.name,
                    clusterId,
                },
            };

            if (GSN_CONSTANTS.CONTEXT_NODES.includes(node.type)) {
                contextNodes.push(cyNode);
            } else {
                nodes.push(cyNode);
            }
        }

        function addGraphEdge(edgeData) {
            const cyEdge = { data: edgeData };
            if (edgeData.type === IN_CONTEXT_OF) {
                cyEdge.data.contextEdge = true;
                contextEdges.push(cyEdge);
            } else {
                edges.push(cyEdge);
            }
        }

        const maxDepth = getGraphElements(data, addGraphNode, addGraphEdge);
        [...nodes, ...contextNodes].forEach((node) => {
            node.data.depth = maxDepth - node.data.depth + 1;
        });

        cy.elements().remove();

        if (nodes.length === 0) {
            return;
        }

        if (showContextNodes) {
            cy.add([...nodes, ...contextNodes, ...edges, ...contextEdges]);
        } else {
            cy.add([...nodes, ...edges]);
        }

        cy.layout(layout).run();

        cy.nodes().unbind('mouseover');
        cy.nodes().bind('mouseover', (e) => {
            e.target.popperRefObj = e.target.popper({
                content: () => {
                    const content = document.createElement('div');
                    const nodeData = e.target.data();
                    const treeId = e.target.id();
                    if (e.target.selected()) {
                        content.style.backgroundColor = COLORS.SELECTED();
                    }

                    content.classList.add('node-zoom-popper');
                    content.style.borderColor = COLORS[nodeData.type];

                    content.addEventListener('click', () => {
                        setSelectedNode({ nodeId: nodeData.modelId, treeId });
                    });

                    content.innerHTML = `<div>${nodeData.name}</div>
<div style="color: grey;font-size: 12px;"> Depth: ${nodeData.assignedDepth}</div>`;

                    document.body.appendChild(content);
                    return content;
                },
                popper: {
                    placement: 'top',
                },
            });
        });

        cy.nodes().unbind('mouseout');
        cy.nodes().bind('mouseout', (e) => {
            if (e.target.popper) {
                e.target.popperRefObj.state.elements.popper.remove();
                e.target.popperRefObj.destroy();
            }
        });
    }, [data, layout, showContextNodes, setSelectedNode, clusterDepth]);

    // Node selection.
    useEffect(() => {
        if (!cyRef?.current) {
            return;
        }

        const cy = cyRef.current;
        cy.off('vclick');

        cy.on('vclick', (e) => {
            if ((e.target.nodes().length === 1 || e.target.edges().length === 1) && typeof e.target.id === 'function') {
                const newlySelectedNodeId = e.target.id();

                if (e.originalEvent && e.originalEvent.ctrlKey) {
                    cy.fit(cy.elements(`#${newlySelectedNodeId.replace(/\//g, '\\/')}`), ZOOM_IN_ON_NODE_PADDING);
                }

                const newlySelectedNode = e.target.data('modelId');
                if (newlySelectedNode)
                    if (selectedNode !== newlySelectedNode) {
                        setSelectedNode({ nodeId: newlySelectedNode, treeId: newlySelectedNodeId });
                    }
            } else {
                setSelectedNode({ nodeId: null, treeId: null });
            }
        });

        if (prevSelectedNode?.nodeId) {
            cy.elements(`[modelId = "${prevSelectedNode.nodeId}"]`).unselect();
        }

        if (selectedNode) {
            cy.elements(`[modelId = "${selectedNode.nodeId}"]`).select();
        }
    }, [data, selectedNode, prevSelectedNode, setSelectedNode]);

    // Viewport changes.
    useEffect(() => {
        if (!cyRef?.current) {
            return;
        }

        const cy = cyRef.current;

        cy.removeListener('viewport');

        if (viewport) {
            cy.viewport(viewport);
        } else {
            cy.fit();
        }

        cy.on(
            'viewport',
            debounce(() => {
                setViewport({
                    zoom: cy.zoom(),
                    pan: cy.pan(),
                });
            }, 100)
        );
    }, [viewport]);

    return (
        <>
            <CytoscapeComponent
                cy={(cy) => {
                    cyRef.current = cy;
                }}
                wheelSensitivity={0.2}
                stylesheet={stylesheet}
                userPanningEnabled={data.length > 1}
                userZoomingEnabled={data.length > 1}
                style={{ width, height, left, top }}
            />
            <FormControlLabel
                title="Toggle to include/exlcude Context nodes"
                style={{ position: 'absolute', bottom: clusterDepth > 0 ? 60 : 0, left: 5 }}
                control={
                    <Switch
                        checked={showContextNodes}
                        onChange={() => setShowContextNodes(!showContextNodes)}
                        color="primary"
                    />
                }
                label="Context nodes"
            />
            {clusterDepth > 0 ? (
                <FormControl
                    title="Depth at which clusters should form"
                    style={{ position: 'absolute', bottom: 0, left: 5 }}
                >
                    <FormLabel>Clustering Depth</FormLabel>
                    <RadioGroup
                        row
                        value={`${clusterDepth}`}
                        onChange={(_, strVal) => setClusterDepth(parseInt(strVal, 10))}
                    >
                        <FormControlLabel value="2" control={<Radio />} label="2" />
                        <FormControlLabel value="3" control={<Radio />} label="3" />
                        <FormControlLabel value="4" control={<Radio />} label="4" />
                        <FormControlLabel value="5" control={<Radio />} label="5" />
                    </RadioGroup>
                </FormControl>
            ) : null}
        </>
    );
}
