import { useState } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Autocomplete, TextField } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------
const filter = createFilterOptions();

AutocompleteStringListInput.propTypes = {
    availableValues: PropTypes.arrayOf(PropTypes.string),
    values: PropTypes.arrayOf(PropTypes.string),
    checkFunction: PropTypes.func,
    onChange: PropTypes.func.isRequired,
};

export default function AutocompleteStringListInput({
    values,
    availableValues,
    onChange,
    checkFunction = (/* newValue */) => ({ valid: true, hint: '' }),
}) {
    const [value, setValue] = useState(null);
    const [hint, setHint] = useState(null);
    const [key, setKey] = useState(crypto.randomUUID());

    const options = availableValues.map((value) => ({ title: value, disabled: values.includes(value) }));

    return (
        <>
            <Autocomplete
                key={key}
                size="small"
                fullWidth
                selectOnFocus
                freeSolo
                clearOnBlur
                clearOnEscape
                handleHomeEndKeys
                value={value}
                options={options}
                getOptionDisabled={(option) => option.disabled}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option.title);
                    if (inputValue !== '' && !isExisting) {
                        filtered.push({
                            inputValue,
                            title: `Add "${inputValue}"`,
                        });
                    }

                    return filtered;
                }}
                onChange={(event, newValue) => {
                    let addedValue;
                    setHint(null);
                    if (typeof newValue === 'string') {
                        const { valid, hint } = checkFunction(newValue);
                        if (!valid) {
                            setHint(hint);
                            setValue({ title: newValue });
                        } else {
                            addedValue = newValue.trim();
                        }
                    } else if (newValue && newValue.inputValue) {
                        const { valid, hint } = checkFunction(newValue.inputValue);
                        if (!valid) {
                            setHint(hint);
                            setValue(newValue);
                        } else {
                            addedValue = newValue.inputValue.trim();
                        }
                    } else if (newValue && newValue.title) {
                        addedValue = newValue.title;
                    } else {
                        setValue(newValue);
                    }

                    if (addedValue) {
                        setValue(null);
                        setKey(crypto.randomUUID());
                        onChange([...values, addedValue].sort());
                    }
                }}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                        return option;
                    }

                    if (option.inputValue) {
                        return option.inputValue;
                    }

                    return option.title;
                }}
                ListboxProps={{ style: { fontSize: '0.8rem' } }}
                renderOption={(props, option) => <li {...props}>{option.title}</li>}
                renderInput={(params) => <TextField {...params} label="Add labels .." />}
            />
            <div style={{ color: '#FF4842' }}>{hint}</div>
        </>
    );
}
