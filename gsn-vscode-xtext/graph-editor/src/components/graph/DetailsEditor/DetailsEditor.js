import PropTypes from 'prop-types';
import { useMemo } from 'react';
// @mui
import { Grid, Typography } from '@mui/material';
// components
import DetailsTextEditor from './DetailsTextEditor';
// util
import { NodeType } from '../gsnTypes';

// --------------------------------------------------------------------------------

DetailsEditor.propTypes = {
    isReadOnly: PropTypes.bool,
    model: PropTypes.arrayOf(NodeType).isRequired,
    selectedNode: PropTypes.shape({
        nodeId: PropTypes.string,
        treeId: PropTypes.string,
    }),
    width: PropTypes.number,
    onAttributeChange: PropTypes.func,
};

export default function DetailsEditor({ isReadOnly, model, selectedNode, width, onAttributeChange }) {
    const nodeData = useMemo(() => {
        if (selectedNode.nodeId) {
            return model.find((n) => n.id === selectedNode.nodeId);
        }

        return null;
    }, [selectedNode, model]);

    return (
        <>
            {nodeData ? (
                <Grid container spacing={1}>
                    <DetailsTextEditor
                        isReadOnly={isReadOnly}
                        id={nodeData.id}
                        value={nodeData.info}
                        width={width}
                        onAttributeChange={onAttributeChange}
                    />
                </Grid>
            ) : (
                <Typography sx={{ p: 1 }} variant="h6">
                    Nothing selected ...
                </Typography>
            )}
        </>
    );
}
