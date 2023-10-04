import PropTypes from 'prop-types';
// @mui
import { FormControl, MenuItem, Select } from '@mui/material';
// ----------------------------------------------------------------------

MultiSelectInput.propTypes = {
    isReadOnly: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    options: PropTypes.arrayOf(PropTypes.object),
    onSubmit: PropTypes.func,
};

export default function MultiSelectInput({ value, options, isReadOnly, onSubmit }) {
    return (
        <FormControl sx={{ minWidth: 120, marginTop: 0 }} disabled={isReadOnly} size="small">
            <Select value={value} onChange={(event) => onSubmit(event.target.value)}>
                {options.map((info) => (
                    <MenuItem key={info.value} value={info.value}>
                        {info.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
