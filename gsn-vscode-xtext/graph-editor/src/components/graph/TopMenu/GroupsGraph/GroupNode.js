import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useStore } from 'reactflow';
import { Divider } from '@mui/material';
// components
import { ChipListValues } from '../../FormComponents';
import { zoomSelector, Header, Summary } from '../../GSNGraph/FlowComponents/Nodes';
// utils
import { COLORS } from '../../theme';
import GSN_CONSTANTS from '../../GSN_CONSTANTS';

GroupNode.propTypes = {
    id: PropTypes.string,
    data: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        inheritedMembers: PropTypes.arrayOf(PropTypes.string),
        isReadOnly: PropTypes.bool,
        width: PropTypes.number,
        height: PropTypes.number,
        hasChildren: PropTypes.bool,
        allLabels: PropTypes.arrayOf(PropTypes.string),
        showLabels: PropTypes.bool,
    }),
};

function GroupNode({ id, data }) {
    const zoom = useStore(zoomSelector);
    const { name, description, members, inheritedMembers, width, height, hasChildren, showLabels } = data;

    const isUniverse = id === GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE;

    return (
        <div
            style={{
                borderColor: isUniverse ? COLORS.UNIVERSE_GROUP_NODE : COLORS.GROUP_NODE,
                textAlign: 'center',
                borderStyle: 'solid',
                borderRadius: '10%',
                width,
                height,
            }}
        >
            {isUniverse ? null : <Handle type="target" position={Position.Left} />}

            <Header
                sx={{ paddingTop: 5, paddingBottom: 5 }}
                label={name}
                zoom={showLabels ? 100 : zoom}
                minimumFontSize={12}
            />

            {showLabels ? (
                <LabelLists members={members} inheritedMembers={inheritedMembers} />
            ) : (
                <Summary summary={description} zoom={zoom} minimumFontSize={10} />
            )}

            {hasChildren ? (
                <Handle style={{ minWidth: 0, width: 0 }} type="source" position={Position.Right}>
                    <svg
                        style={{ position: 'absolute', top: -3, left: -8 }}
                        width={14}
                        height={12}
                        viewBox="0 0 120 80"
                    >
                        <polyline fill="#404040" points="0 40,60 80,120 40,60 0" />
                    </svg>
                </Handle>
            ) : (
                <Handle type="source" position={Position.Right} />
            )}
        </div>
    );
}

LabelLists.propTypes = {
    members: PropTypes.arrayOf(PropTypes.string),
    inheritedMembers: PropTypes.arrayOf(PropTypes.string),
};

function LabelLists({ members, inheritedMembers }) {
    return (
        <>
            <ChipListValues
                stacked
                isReadOnly
                variant="contained"
                noValuesMessage="No direct members.."
                values={members}
            />
            <Divider sx={{ marginTop: '6px', marginBottom: '2px' }} />
            <ChipListValues
                stacked
                isReadOnly
                variant="outlined"
                noValuesMessage="No inherited members.."
                values={inheritedMembers}
            />
        </>
    );
}

export default memo(GroupNode);
