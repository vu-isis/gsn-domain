import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';
// @mui
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
} from '@mui/material';
// components
import { ChipListValues } from '../../FormComponents';
import CommonTableHeadAndFoot from '../CommonTableHeadAndFoot';
// utils
import { COLORS } from '../../theme';
import { getLabelUsageCounts, isValidLabelOrGroupName } from '../labelUtils';
import { NodeType, LabelType, ViewType } from '../../gsnTypes';

LabelTable.propTypes = {
    isReadOnly: PropTypes.bool,
    labels: PropTypes.arrayOf(LabelType),
    views: PropTypes.arrayOf(ViewType),
    model: PropTypes.arrayOf(NodeType),
    onAddNewLabel: PropTypes.func.isRequired,
    onDeleteLabel: PropTypes.func.isRequired,
    onUpdateLabel: PropTypes.func.isRequired,
};

export default function LabelTable({ isReadOnly, labels, views, model, onAddNewLabel, onDeleteLabel, onUpdateLabel }) {
    const [pageSize, setPageSize] = useState(10);
    const [pageIndex, setPageIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '' });
    const [isAdding, setIsAdding] = useState(false);

    const data = useMemo(() => {
        const result = [];
        const labelNameToGroups = {};
        const { inNodesCount, inViewsCount } = getLabelUsageCounts(model, views);
        const undeclaredLabels = new Set([...Object.keys(inNodesCount), ...Object.keys(inViewsCount)]);
        labels.forEach((labelInfo) => {
            const labelName = labelInfo.name;
            undeclaredLabels.delete(labelName);

            if (labelInfo.isGroup) {
                labelInfo.members.forEach((label) => {
                    if (!labelNameToGroups[label]) {
                        labelNameToGroups[label] = [];
                    }

                    labelNameToGroups[label].push(labelInfo.name);
                });
                return;
            }

            result.push({
                id: labelName,
                name: labelName,
                description: labelInfo.description,
                inNodes: inNodesCount[labelName] || 0,
                inViews: inViewsCount[labelName] || 0,
                groups: null, // Populated after this iteration..
            });
        });

        result.forEach((entry) => {
            entry.groups = labelNameToGroups[entry.id] || [];
        });

        undeclaredLabels.forEach((labelName) => {
            result.unshift({
                isUndeclared: true,
                id: labelName,
                name: labelName,
                description: 'Used but not declared!!',
                inNodes: inNodesCount[labelName] || 0,
                inViews: inViewsCount[labelName] || 0,
                groups: [],
            });
        });

        return result;
    }, [labels, views, model]);

    const onAddClick = () => {
        setSearchTerm('');
        setEditData({ name: '', description: '' });
        setIsAdding(true);
    };

    const onSaveAdd = (data) => {
        data = data || editData;
        const nameCheck = isValidLabelOrGroupName(data.name);
        if (!nameCheck.valid) {
            console.error(nameCheck.hint);
            return;
        }

        if (labels.some((e) => e.name === data.name)) {
            console.error('Name must be unique');
            return;
        }

        onAddNewLabel({
            name: data.name,
            description: data.description,
            isGroup: false,
        });
        setIsAdding(false);
    };

    const onCancelAdd = () => {
        setIsAdding(false);
    };

    const onEditClick = (row) => {
        setEditData(row);
        setEditingId(row.id);
    };

    const onSaveEdit = () => {
        if (editData.name !== editData.orgName) {
            const nameCheck = isValidLabelOrGroupName(editData.name);
            if (!nameCheck.valid) {
                console.error(nameCheck.hint);
                return;
            }

            if (labels.some((e) => e.name === editData.name && e.name !== editData.orgName)) {
                console.error('Name must be unique');
                return;
            }
        }

        onUpdateLabel(editingId, {
            name: editData.name,
            description: editData.description,
            isGroup: false,
        });
        setEditingId(null);
    };

    const onCancelEdit = () => {
        setEditingId(null);
    };

    const onDeleteClick = (rowData) => {
        if (rowData.inNodes > 0) {
            console.error('This should prompt!');
            // if (!window.confirm('This will remove the label from all nodes - would you like to proceed?')) {
            //     return;
            // }
        }

        onDeleteLabel(rowData.id);
    };

    const filteredData = data.filter((row) => row.name.toLowerCase().includes(searchTerm));
    const paginatedData = filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    return (
        <CommonTableHeadAndFoot
            isReadOnly={isReadOnly}
            isAdding={isAdding}
            rowCount={filteredData.length}
            pageIndex={pageIndex}
            pageSize={pageSize}
            editingId={editingId}
            searchTerm={searchTerm}
            editData={editData}
            onAddClick={onAddClick}
            onSaveAdd={onSaveAdd}
            onCancelAdd={onCancelAdd}
            setEditData={setEditData}
            setSearchTerm={setSearchTerm}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
        >
            <TableContainer component={Paper}>
                <Table stickyHeader size={'small'}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Groups</TableCell>
                            <TableCell>In Nodes</TableCell>
                            <TableCell>In Views</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row) => (
                            <TableRow
                                key={row.id}
                                style={{ backgroundColor: row.isUndeclared ? COLORS.DIFF.REMOVED : undefined }}
                            >
                                <TableCell>
                                    {editingId === row.id ? (
                                        <TextField
                                            size="small"
                                            margin="dense"
                                            label="Name"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        />
                                    ) : (
                                        <ChipListValues variant="contained" isReadOnly values={[row.name]} />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === row.id ? (
                                        <TextField
                                            size="small"
                                            margin="dense"
                                            label="Description"
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        />
                                    ) : (
                                        row.description
                                    )}
                                </TableCell>
                                <TableCell>
                                    <ChipListValues isReadOnly values={row.groups} noValuesMessage="In no groups .." />
                                </TableCell>
                                <TableCell>{row.inNodes}</TableCell>
                                <TableCell>{row.inViews}</TableCell>
                                <TableCell>
                                    {editingId === row.id ? (
                                        <>
                                            <Button onClick={onSaveEdit}>SAVE</Button>
                                            <Button onClick={onCancelEdit}>CANCEL</Button>
                                        </>
                                    ) : row.isUndeclared ? (
                                        <Button
                                            color="success"
                                            variant="contained"
                                            disabled={isReadOnly || isAdding}
                                            onClick={() => {
                                                onSaveAdd({ name: row.name, description: '' });
                                            }}
                                        >
                                            ADD
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                disabled={isReadOnly || isAdding}
                                                onClick={() => {
                                                    onEditClick({
                                                        ...row,
                                                        description: row.description || '',
                                                        orgName: row.name,
                                                    });
                                                }}
                                            >
                                                EDIT
                                            </Button>
                                            <Button
                                                disabled={isReadOnly || isAdding}
                                                color="error"
                                                onClick={() => onDeleteClick(row)}
                                            >
                                                DELETE
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </CommonTableHeadAndFoot>
    );
}
