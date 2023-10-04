import PropTypes from 'prop-types';
import { useCallback, useState, useEffect, useRef } from 'react';
// @mui
import { Grid, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// ace-editor
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-plain_text';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-terminal';

// --------------------------------------------------------------------------------

DetailsTextEditor.propTypes = {
    isReadOnly: PropTypes.bool,
    id: PropTypes.string,
    value: PropTypes.string,
    width: PropTypes.number,
    onAttributeChange: PropTypes.func,
};

export default function DetailsTextEditor({ isReadOnly, id, value, width, onAttributeChange }) {
    const themeMode = useTheme().palette.mode;
    const [text, setText] = useState(value);
    const saveClickRef = useRef();

    const hasChanges = text !== value;

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            onSaveClick();
            e.preventDefault();
        }
    };

    const onSaveClick = () => {
        if (hasChanges && !isReadOnly) {
            onAttributeChange(id, 'info', text);
        }
    };

    saveClickRef.current = onSaveClick;

    useEffect(
        () => () => {
            saveClickRef.current();
        },
        []
    );

    useEffect(() => {
        setText(value);
    }, [id, value]);

    const onChange = useCallback((newText) => {
        setText(newText);
    }, []);

    return (
        <>
            <Grid item xs={12} margin={1}>
                <Typography variant="h6">Info</Typography>
                <AceEditor
                    onKeyDown={handleKeyDown}
                    readOnly={isReadOnly}
                    placeholder="Enter info (click save to persist changes).."
                    mode="plain_text"
                    theme={themeMode === 'dark' ? 'terminal' : 'github'}
                    name={id}
                    onChange={onChange}
                    fontSize={'0.8rem'}
                    showGutter
                    highlightActiveLine
                    showPrintMargin={false}
                    width={`${width - 24}px`}
                    height={'calc(100vh - 90px)'} // TODO: This does not account for any header-hight
                    value={text}
                    setOptions={{
                        wrap: true,
                        fixedWidthGutter: true,
                        showLineNumbers: true,
                        tabSize: 2,
                    }}
                />
            </Grid>
            {isReadOnly ? null : (
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', marginRight: '16px' }}>
                    <Button color="primary" disabled={isReadOnly || !hasChanges} onClick={onSaveClick}>
                        Save
                    </Button>
                </Grid>
            )}
        </>
    );
}
