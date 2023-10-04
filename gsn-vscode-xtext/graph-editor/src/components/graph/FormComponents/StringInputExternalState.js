import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
// @mui
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
// ----------------------------------------------------------------------
const inputStyle = (multiline) => ({ style: { fontSize: '0.9rem', padding: multiline ? 0 : '8px' } });

StringInputExternalState.propTypes = {
    isReadOnly: PropTypes.bool,
    rows: PropTypes.number,
    label: PropTypes.string,
    textInfo: PropTypes.shape({
        value: PropTypes.string,
        valid: PropTypes.bool,
        hint: PropTypes.string,
    }),
    fullWidth: PropTypes.bool,
    isSubmitted: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    onClear: PropTypes.func,
};

export default function StringInputExternalState({
    textInfo,
    fullWidth,
    isSubmitted,
    onChange,
    onBlur,
    isReadOnly = false,
    rows = 1,
    label,
    onClear,
}) {
    const onChangeCb = useCallback(
        (el) => {
            onChange(el.target.value);
        },
        [onChange]
    );

    const onKeyDown = useCallback(
        (e) => {
            if (rows === 1 && e.key === 'Enter') {
                e.target.blur();
            }
        },
        [rows]
    );

    const inputProps = useMemo(() => {
        if (typeof onClear !== 'function' || isReadOnly) {
            return {};
        }

        return {
            endAdornment: (
                <InputAdornment position="end">
                    <IconButton onClick={onClear}>
                        <ClearIcon />
                    </IconButton>
                </InputAdornment>
            ),
        };
    }, [onClear, isReadOnly]);

    return (
        <TextField
            fullWidth={Boolean(fullWidth)}
            disabled={isReadOnly}
            size={label ? 'small' : undefined}
            inputProps={label ? undefined : inputStyle(rows > 1)}
            label={label}
            type="text"
            multiline={rows > 1}
            minRows={rows}
            value={textInfo.value}
            onKeyDown={onKeyDown}
            onChange={onChangeCb}
            onBlur={onBlur}
            InputProps={inputProps}
            error={isSubmitted && !textInfo.valid}
            helperText={isSubmitted && !textInfo.valid ? textInfo.hint : ''}
        />
    );
}
