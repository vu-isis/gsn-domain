/* eslint-disable no-restricted-syntax */
import { useState } from 'react';
import PropTypes from 'prop-types';
// @mui
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Button,
    IconButton,
    Snackbar,
    TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// hooks
import { useGlobalState } from './hooks/useGlobalState';

// ----------------------------------------------------------------------

TextEditor.propTypes = {
    stateType: PropTypes.string, // model views labels
    onClose: PropTypes.func,
};

// This is just a dev-tool for quickly modifying the model or labels.
export default function TextEditor({ stateType, onClose }) {
    if (!['model', 'views', 'labels', 'commits'].includes(stateType)) {
        alert('Invalid type for TextEditor!');
    }

    const [globalState, updateGlobalState] = useGlobalState();
    const [errorMessage, setErrorMessage] = useState(null);
    const [text, setText] = useState(JSON.stringify(globalState[stateType], null, 2));
    const [hasChanged, setHasChanged] = useState(false);

    function parseText(value) {
        let json;
        try {
            json = JSON.parse(value);
        } catch (err) {
            throw new Error('Text is not valid json');
        }

        if (!(json instanceof Array)) {
            throw new Error('Not an array!');
        }

        for (const obj of json) {
            if (obj === null || typeof obj !== 'object') {
                throw new Error('Not an array of objects!');
            }
        }

        return json;
    }

    const onChange = (e) => {
        setText(e.target.value);
        if (!hasChanged) {
            setHasChanged(true);
        }
    };

    const onBlur = () => {
        try {
            parseText(text);
        } catch (err) {
            setErrorMessage(err.message);
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setErrorMessage(null);
    };

    const onSave = () => {
        try {
            const newState = parseText(text);
            // TODO: Add checks
            updateGlobalState(stateType, newState);
        } catch (err) {
            setErrorMessage(err.message);
        }
    };

    return (
        <Dialog
            open
            disableEscapeKeyDown
            PaperProps={{
                sx: {
                    maxHeight: '80vh',
                    minHeight: '80vh',
                    maxWidth: '50vw',
                    minWidth: '50vw',
                },
            }}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Edit raw JSON format</DialogTitle>
            <DialogContent>
                <Snackbar
                    open={Boolean(errorMessage)}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    message={errorMessage}
                    action={
                        <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                />
                <Grid container columnSpacing={1}>
                    <Grid item xs={1}>
                        <Button fullWidth sx={{ fontSize: 13 }} onClick={onSave} disabled={!hasChanged}>
                            Save
                        </Button>
                    </Grid>
                    <Grid item xs={11}>
                        <TextField
                            inputProps={{
                                style: {
                                    fontFamily:
                                        'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                                    fontSize: 12,
                                    lineHeight: 1.2,
                                },
                            }}
                            style={{
                                position: 'absolute',
                                height: '80%',
                                overflow: 'auto',
                                width: '90%',
                                backgroundColor: '#f5f5f5',
                            }}
                            type="text"
                            multiline
                            value={text}
                            onChange={onChange}
                            onBlur={onBlur}
                            error={false}
                            helperText={''}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
