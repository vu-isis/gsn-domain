import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
// @mui
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
// components
import CommonTableHeadAndFoot from '../CommonTableHeadAndFoot';
import GroupRow from './GroupRow';

// utils
// import { COLORS } from '../../theme';
import { isValidLabelOrGroupName } from '../labelUtils';
import { tryParseLabelsFromViewExpression } from '../ViewEditor/viewUtils';
import { LabelType, ViewType } from '../../gsnTypes';

GroupTable.propTypes = {
    isReadOnly: PropTypes.bool,
    labels: PropTypes.arrayOf(LabelType),
    views: PropTypes.arrayOf(ViewType),
    onAddNewLabel: PropTypes.func.isRequired,
    onDeleteLabel: PropTypes.func.isRequired,
    onUpdateLabel: PropTypes.func.isRequired,
};

export default function GroupTable({ labels, views, isReadOnly, onAddNewLabel, onDeleteLabel, onUpdateLabel }) {
    const [pageSize, setPageSize] = useState(10);
    const [pageIndex, setPageIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '' });
    const [isAdding, setIsAdding] = useState(false);

    const { data, labelNames } = useMemo(() => {
        const data = [];
        const labelNames = [];
        const viewInfos = views.map((view) => tryParseLabelsFromViewExpression(view.expression));
        labels.forEach((labelInfo) => {
            const labelName = labelInfo.name;
            if (!labelInfo.isGroup) {
                labelNames.push(labelName);
                return;
            }

            data.push({
                id: labelName,
                name: labelName,
                description: labelInfo.description,
                inViews: viewInfos
                    .map((viewLabels) => (viewLabels.has(labelName) ? 1 : 0))
                    .reduce((sum, val) => sum + val, 0),
                parent: labelInfo.parent,
                members: labelInfo.members,
            });
        });

        labelNames.sort();
        data.sort((a, b) => a.name.localeCompare(b.name));

        return { data, labelNames };
    }, [labels, views]);

    // Adding callbacks
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
            isGroup: true,
            parent: null,
            members: [],
        });
        setIsAdding(false);
    };

    const onCancelAdd = () => {
        setIsAdding(false);
    };

    // Edit row callbacks
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
            isGroup: true,
            parent: editData.parent,
            members: editData.members,
        });
        setEditingId(null);
    };

    const onCancelEdit = () => {
        setEditingId(null);
    };

    // Delete
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
                            <TableCell>Parent Group</TableCell>
                            <TableCell>Members</TableCell>
                            <TableCell>In Views</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row) => (
                            <GroupRow
                                key={row.id}
                                isReadOnly={isReadOnly}
                                editingId={editingId}
                                editData={editData}
                                row={row}
                                labelNames={labelNames}
                                onEditClick={onEditClick}
                                setEditData={setEditData}
                                onSaveEdit={onSaveEdit}
                                onCancelEdit={onCancelEdit}
                                onDeleteClick={onDeleteClick}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </CommonTableHeadAndFoot>
    );
}
