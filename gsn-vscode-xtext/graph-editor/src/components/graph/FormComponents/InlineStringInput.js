import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// @mui
import { TextField, Typography, ClickAwayListener } from '@mui/material';

InlineStringInput.propTypes = {
    initialValue: PropTypes.string.isRequired,
    label: PropTypes.string,
    isReadOnly: PropTypes.bool,
    fullWidth: PropTypes.bool,
    sx: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
};

export default function InlineStringInput({ initialValue, label, isReadOnly, fullWidth, onSubmit, sx = {} }) {
    const [value, setValue] = useState(initialValue);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue, onSubmit]);

    const handleBlur = () => {
        onSubmit(value);
        setIsEditing(false);
    };

    const handleClick = () => {
        setIsEditing(true);
    };

    const handleChange = (e) => {
        setValue(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    if (isEditing && !isReadOnly) {
        return (
            <ClickAwayListener onClickAway={handleBlur}>
                <TextField
                    label={label}
                    fullWidth={fullWidth}
                    variant="standard"
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    sx={{
                        '& .MuiInputBase-root': {
                            background: 'transparent',
                        },
                        ...sx,
                    }}
                />
            </ClickAwayListener>
        );
    }

    return (
        <Typography
            variant="h6"
            component="div"
            onClick={handleClick}
            sx={{
                cursor: isReadOnly ? undefined : 'pointer',
            }}
        >
            {value}
        </Typography>
    );
}
