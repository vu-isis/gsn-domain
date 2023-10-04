import { useState } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Autocomplete, TextField } from '@mui/material';

// ----------------------------------------------------------------------

AutocompleteStringListSelector.propTypes = {
    label: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            title: PropTypes.string,
            type: PropTypes.string,
        })
    ),
    onSelect: PropTypes.func,
    sx: PropTypes.object,
};

export default function AutocompleteStringListSelector({ label, options, onSelect, sx }) {
    const [key, setKey] = useState(crypto.randomUUID());
    const oIds = new Set();
    options.forEach((o) => {
        if (oIds.has(o.id)) {
            console.warn(JSON.stringify(o));
        } else {
            oIds.add(o.id);
        }
    });

    return (
        <>
            <Autocomplete
                key={key}
                size="small"
                sx={sx}
                fullWidth
                ListboxProps={{ style: { fontSize: '0.8rem' } }}
                options={options}
                groupBy={(option) => option.type}
                onChange={(e, value) => {
                    if (value) {
                        onSelect(value.id);
                    }

                    setKey(crypto.randomUUID());
                }}
                getOptionLabel={(option) => option.title}
                renderOption={(props, opts) => (
                    <li {...props} key={opts.id}>
                        {opts.title}
                    </li>
                )}
                renderInput={(params) => <TextField {...params} label={label} />}
            />
        </>
    );
}
