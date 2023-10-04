import PropTypes from 'prop-types';
import React from 'react';
// @mui
import { Button, TableCell, TableRow, TextField } from '@mui/material';
// components
import { AutocompleteStringListSelector, ChipListValues } from '../../FormComponents';

GroupRow.propTypes = {
    isReadOnly: PropTypes.bool,
    isAdding: PropTypes.bool,
    editingId: PropTypes.string,
    editData: PropTypes.object.isRequired,
    row: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        inViews: PropTypes.number,
        parent: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    labelNames: PropTypes.array,
    onEditClick: PropTypes.func.isRequired,
    setEditData: PropTypes.func.isRequired,
    onSaveEdit: PropTypes.func.isRequired,
    onCancelEdit: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
};

export default function GroupRow({
    isReadOnly,
    isAdding,
    editingId,
    editData,
    row,
    labelNames,
    onEditClick,
    setEditData,
    onSaveEdit,
    onCancelEdit,
    onDeleteClick,
}) {
    const onAddMember = (labelName) => {
        const newEditData = { ...editData };
        newEditData.members.push(labelName);
        newEditData.members.sort();
        setEditData(newEditData);
    };

    const onRemoveMember = (labelName) => {
        const newEditData = { ...editData };
        newEditData.members = newEditData.members.filter((l) => l !== labelName);
        setEditData(newEditData);
    };

    if (row.id !== editingId) {
        return (
            <TableRow key={row.id}>
                <TableCell>
                    <ChipListValues variant="contained" isReadOnly values={[row.name]} />
                </TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                    <ChipListValues isReadOnly values={row.parent ? [row.parent] : []} noValuesMessage="No parent" />
                </TableCell>
                <TableCell>
                    <ChipListValues isReadOnly values={row.members} noValuesMessage="No labels .." />
                </TableCell>
                <TableCell>{row.inViews}</TableCell>
                <TableCell>
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
                    <Button disabled={isReadOnly || isAdding} color="error" onClick={() => onDeleteClick(row)}>
                        DELETE
                    </Button>
                </TableCell>
            </TableRow>
        );
    }

    const options = labelNames
        .filter((labelName) => !editData.members.includes(labelName))
        .map((labelName) => ({ id: labelName, title: labelName, type: null }));

    return (
        <TableRow key={row.id}>
            <TableCell>
                <TextField
                    size="small"
                    margin="dense"
                    label="Name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
            </TableCell>
            <TableCell>
                <TextField
                    size="small"
                    margin="dense"
                    label="Description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
            </TableCell>
            <TableCell>
                <ChipListValues isReadOnly values={row.parent ? [row.parent] : []} noValuesMessage="No parent" />
            </TableCell>
            <TableCell>
                <ChipListValues
                    isReadOnly={isReadOnly}
                    values={editData.members}
                    noValuesMessage="No labels .."
                    onClick={onRemoveMember}
                />
                <AutocompleteStringListSelector
                    sx={{ width: '90%', marginLeft: '4px', marginTop: '8px' }}
                    label={'Add label ..'}
                    options={options}
                    onSelect={onAddMember}
                />
            </TableCell>
            <TableCell>{row.inViews}</TableCell>
            <TableCell>
                <Button onClick={onSaveEdit}>SAVE</Button>
                <Button onClick={onCancelEdit}>CANCEL</Button>
            </TableCell>
        </TableRow>
    );
}
