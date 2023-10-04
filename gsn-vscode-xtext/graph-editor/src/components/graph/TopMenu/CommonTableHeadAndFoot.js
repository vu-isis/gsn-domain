import PropTypes from 'prop-types';
import React from 'react';
// @mui
import { Button, Grid, TextField, TablePagination } from '@mui/material';

CommonTableHeadAndFoot.propTypes = {
    isReadOnly: PropTypes.bool,
    isAdding: PropTypes.bool,
    rowCount: PropTypes.number,
    pageIndex: PropTypes.number,
    pageSize: PropTypes.number,
    searchTerm: PropTypes.string,
    editingId: PropTypes.string,
    editData: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
    }).isRequired,
    onAddClick: PropTypes.func.isRequired,
    onSaveAdd: PropTypes.func.isRequired,
    onCancelAdd: PropTypes.func.isRequired,
    setEditData: PropTypes.func.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    setPageIndex: PropTypes.func.isRequired,
    setPageSize: PropTypes.func.isRequired,
    children: PropTypes.element,
};

export default function CommonTableHeadAndFoot({
    isReadOnly,
    isAdding,
    rowCount,
    pageIndex,
    pageSize,
    searchTerm,
    editingId,
    editData,
    onAddClick,
    onSaveAdd,
    onCancelAdd,
    setEditData,
    setSearchTerm,
    setPageIndex,
    setPageSize,
    children,
}) {
    let header;
    if (isAdding) {
        header = (
            <Grid
                container
                justifyContent="space-between"
                alignItems="center"
                sx={{ backgroundColor: 'rgb(166 166 200 / 20%)', borderRadius: '10px', padding: '10px' }}
            >
                <Grid item>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                </Grid>
                <Grid item>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Optional Description"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                </Grid>
                <Grid item>
                    <Button onClick={() => onSaveAdd()}>SAVE</Button>
                    <Button onClick={onCancelAdd}>CANCEL</Button>
                </Grid>
            </Grid>
        );
    } else {
        header = (
            <Grid container justifyContent="space-between" alignItems="center">
                <Grid item>
                    <TextField
                        key="search-field"
                        size="small"
                        margin="dense"
                        label="Search"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value.toLowerCase());
                            setPageIndex(0);
                        }}
                    />
                </Grid>
                <Grid item>
                    <Button
                        disabled={isReadOnly || Boolean(editingId)}
                        onClick={onAddClick}
                        variant="contained"
                        color="success"
                    >
                        + ADD
                    </Button>
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container sx={{ paddingX: 2 }}>
            {header}
            {children}

            <TablePagination
                component="div"
                count={rowCount}
                page={pageIndex}
                onPageChange={(_, newPage) => setPageIndex(newPage)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => setPageSize(parseInt(event.target.value, 10))}
            />
        </Grid>
    );
}
