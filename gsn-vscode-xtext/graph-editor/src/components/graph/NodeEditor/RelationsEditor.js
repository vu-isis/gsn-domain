import { useMemo } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Button, Divider, IconButton, Grid, List, ListItem, ListItemText, ListSubheader } from '@mui/material';
import { RemoveCircleOutline } from '@mui/icons-material';
// from-components
import { AutocompleteStringListSelector } from '../FormComponents';
// utils
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import modelUtils from '../modelUtils';
import { NodeType } from '../gsnTypes';

// ----------------------------------------------------------------------

const listItemStyle = { fontSize: '0.8rem' };
const buttonStyle = { fontSize: '0.8rem', textTransform: 'none', fontWeight: '600' };

RelationsEditor.propTypes = {
    nodeId: PropTypes.string,
    isReadOnly: PropTypes.bool,
    model: PropTypes.arrayOf(NodeType).isRequired,
    setSelectedNode: PropTypes.func,
    onNewChildNode: PropTypes.func,
    onDeleteConnection: PropTypes.func,
};

export default function RelationsEditor(props) {
    const node = props.model.find((n) => n.id === props.nodeId);
    const relations = [];
    if (GSN_CONSTANTS.SOLVED_BY_OWNERS.includes(node.type)) {
        relations.push(GSN_CONSTANTS.RELATION_TYPES.SOLVED_BY);
    }

    if (GSN_CONSTANTS.IN_CONTEXT_OF_OWNERS.includes(node.type)) {
        relations.push(GSN_CONSTANTS.RELATION_TYPES.IN_CONTEXT_OF);
    }

    return (
        <>
            {relations.map((relationType) => (
                <RelationSection
                    key={relationType}
                    nodeType={node.type}
                    relationType={relationType}
                    relations={[...(node[relationType] || [])].sort()}
                    {...props}
                />
            ))}
        </>
    );
}

RelationSection.propTypes = {
    relationType: PropTypes.string,
    nodeType: PropTypes.string,
    relations: PropTypes.arrayOf(PropTypes.string),
    nodeId: PropTypes.string,
    isReadOnly: PropTypes.bool,
    model: PropTypes.array,
    setSelectedNode: PropTypes.func,
    onNewChildNode: PropTypes.func,
    onDeleteConnection: PropTypes.func,
};

function RelationSection({
    nodeId,
    nodeType,
    isReadOnly,
    model,
    relationType,
    relations,
    setSelectedNode,
    onNewChildNode,
    onDeleteConnection,
}) {
    const targetTypes =
        relationType === GSN_CONSTANTS.RELATION_TYPES.SOLVED_BY
            ? GSN_CONSTANTS.SOLVED_BY_TARGETS[nodeType]
            : GSN_CONSTANTS.IN_CONTEXT_OF_TARGETS[nodeType];

    const validTargets = useMemo(
        () =>
            modelUtils
                .getValidTargets(model, nodeId, targetTypes, relations)
                .map((node) => {
                    const res = {
                        id: node.id,
                        type: node.type,
                        title: node.name,
                    };

                    if (node.summary) {
                        let { summary } = node;
                        if (summary.length > 25) {
                            summary = `${summary.substring(0, 22)}...`;
                        }

                        res.title += ` - ${summary}`;
                    }

                    return res;
                })
                .sort((a, b) => {
                    if (a.type === b.type) {
                        return a.title.localeCompare(b.title);
                    }

                    return a.type.localeCompare(b.type);
                }),
        [model, nodeId, targetTypes, relations]
    );

    return (
        <>
            <Grid container spacing={1} style={{ padding: 4 }}>
                <Grid item xs={12}>
                    <List subheader={<ListSubheader component="div">{relationType}</ListSubheader>}>
                        {relations.map((dstId) => (
                            <ListItem
                                key={dstId}
                                style={{ paddingTop: 1, paddingBottom: 1 }}
                                secondaryAction={
                                    isReadOnly ? null : (
                                        <IconButton
                                            onClick={() => {
                                                onDeleteConnection(nodeId, relationType, dstId);
                                            }}
                                        >
                                            <RemoveCircleOutline style={{ width: 14, height: 14 }} />
                                        </IconButton>
                                    )
                                }
                            >
                                <ListItemText
                                    style={{
                                        cursor: 'pointer',
                                        marginLeft: 10,
                                    }}
                                    primaryTypographyProps={listItemStyle}
                                    primary={dstId.split('/').pop()}
                                    onClick={() => {
                                        // TODO:
                                        setSelectedNode({ nodeId: dstId, treeId: null });
                                    }}
                                />
                            </ListItem>
                        ))}
                        {relations.length === 0 ? (
                            <ListItem style={{ paddingTop: 0, paddingBottom: 0 }}>
                                <ListItemText
                                    style={{ color: 'grey', fontStyle: 'italic' }}
                                    primaryTypographyProps={listItemStyle}
                                    primary={'No relations ..'}
                                />
                            </ListItem>
                        ) : null}
                    </List>
                </Grid>
                {isReadOnly ? null : (
                    <>
                        <Grid item xs={12} style={{ textAlign: 'center' }}>
                            {targetTypes.map((childType) => (
                                <Button
                                    sx={buttonStyle}
                                    key={childType}
                                    onClick={() => {
                                        onNewChildNode(nodeId, relationType, childType);
                                    }}
                                >
                                    + {childType}
                                </Button>
                            ))}
                        </Grid>
                        <Grid item xs={1} />
                        <Grid item xs={10}>
                            <AutocompleteStringListSelector
                                label={'Link with existing ..'}
                                options={validTargets}
                                onSelect={(targetId) => {
                                    onNewChildNode(nodeId, relationType, null, targetId);
                                }}
                            />
                        </Grid>
                        <Grid item xs={1} />
                    </>
                )}
            </Grid>
            <Divider />
        </>
    );
}
