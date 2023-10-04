import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { ReactFlowProvider, Controls, ControlButton } from 'reactflow';
import { Label as LabelIcon, LabelOff as LabelOffIcon } from '@mui/icons-material';
// components
import GroupNode from './GroupNode';
// utils
import { resolveGroupMembers } from '../labelUtils';
import { getLayoutedElements } from '../../GSNGraph/graphUtils';
import GSN_CONSTANTS from '../../GSN_CONSTANTS';
// types
import { LabelType } from '../../gsnTypes';

const nodeTypes = { GroupNode };

GroupGraph.propTypes = {
    isReadOnly: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    labels: PropTypes.arrayOf(LabelType),
    onUpdateLabel: PropTypes.func.isRequired,
};

const getEdgeId = (source, target) => `${source}-->${target}`;

export default function GroupGraph({ isReadOnly, width, height, labels, onUpdateLabel }) {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showLabels, setShowLabels] = useState(true);

    useEffect(() => {
        const groups = [];
        const allLabels = [];
        const groupToInheritedLabels = resolveGroupMembers(labels, true);
        labels.forEach((desc) => {
            if (desc.isGroup) {
                groups.push(desc);
            } else {
                allLabels.push(desc.name);
            }
        });

        allLabels.sort();

        const edges = [];
        const nodes = [];
        nodes.push({
            id: GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE,
            position: { x: 0, y: 0 },
            type: 'GroupNode',
            data: {
                name: `${GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE} (Universe)`,
                description: 'The root of all groups which contains all labels.',
                members: [],
                inheritedMembers: allLabels,
                isReadOnly: true,
                allLabels,
                parent: null,
                showLabels,
                hasChildren: groups.length > 0,
            },
        });

        groups.forEach((desc) => {
            const { name } = desc;
            const parentGroup = desc.parent || GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE;
            edges.push({
                id: getEdgeId(parentGroup, name),
                source: parentGroup,
                target: name,
                data: {},
                style: {
                    strokeWidth: 1,
                    stroke: '#404040',
                },
            });

            nodes.push({
                id: name,
                position: { x: 0, y: 0 },
                type: 'GroupNode',
                data: {
                    ...desc,
                    inheritedMembers: [...groupToInheritedLabels.get(name)].sort(),
                    hasChildren: groups.some((groupDesc) => groupDesc.parent === name),
                    allLabels,
                    isReadOnly,
                    showLabels,
                },
            });
        });

        nodes.forEach((n) => {
            n.data.width = 180;
            n.data.height = 80;
            if (showLabels) {
                const nbrOfLabels = (n.data.members.length || 1) + (n.data.inheritedMembers.length || 1);
                n.data.height = 50 + 24 * nbrOfLabels;
            }
        });

        getLayoutedElements(nodes, edges, 'LR');

        setNodes(nodes);
        setEdges(edges);
    }, [labels, isReadOnly, onUpdateLabel, showLabels]);

    const onConnect = useCallback(
        (eventData) => {
            const { source: parentName, target: childName } = eventData;
            function getInfo(labelName) {
                return labels.find((l) => l.name === labelName);
            }
            const parent = getInfo(parentName);
            const child = getInfo(childName);

            if (parentName === GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE) {
                onUpdateLabel(child.name, { ...child, parent: null });
                return;
            }

            let ancestorName = parent.parent;
            while (ancestorName) {
                if (ancestorName === childName) {
                    console.error('TODO: Alert: Circular parent-child relation');
                    return;
                }

                ancestorName = getInfo(ancestorName).parent;
            }

            onUpdateLabel(child.name, { ...child, parent: parentName });
        },
        [labels, onUpdateLabel]
    );

    return (
        <div style={{ width, height }}>
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    onConnect={isReadOnly ? () => {} : onConnect}
                >
                    <Controls position="bottom-left" showInteractive={false}>
                        <ControlButton
                            title={`${showLabels ? 'hide' : 'show'} labels`}
                            onClick={() => {
                                setShowLabels(!showLabels);
                            }}
                        >
                            {showLabels ? <LabelOffIcon /> : <LabelIcon />}
                        </ControlButton>
                    </Controls>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
