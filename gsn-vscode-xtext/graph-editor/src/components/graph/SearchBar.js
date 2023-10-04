import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import debounce from 'debounce';
// @mui
import { styled, alpha } from '@mui/material/styles';
import { Input, Slide, Button, InputAdornment, Paper } from '@mui/material';
import { Search } from '@mui/icons-material';
// hooks
import usePrevious from './hooks/usePrevious';

const transparent = alpha('#919EAB', 0.16);

const StyledSearchbar = styled(Paper)(() => ({
    top: 0,
    left: '35%',
    zIndex: 9999,
    width: '30%',
    display: 'flex',
    position: 'absolute',
    alignItems: 'center',
    height: 50,
    padding: 10,
    boxShadow: `0 8px 16px 0 ${transparent}`,
}));

SearchBar.propTypes = {
    open: PropTypes.bool,
    onUpdate: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
};

export default function SearchBar({ open, onUpdate, onClear }) {
    const [searchText, setSearchText] = useState('');
    const wasOpen = usePrevious(open);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedUpdate = useCallback(
        debounce((newValue) => {
            onUpdate(newValue.toLocaleLowerCase());
        }, 200),
        [onUpdate]
    );

    useEffect(() => {
        function handleKeyDown(e) {
            if (open && e.key === 'Escape') {
                onClear();
                e.preventDefault();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClear]);

    useEffect(() => {
        if (open && !wasOpen && searchText) {
            onUpdate(searchText);
        }
    }, [open, wasOpen, onUpdate, searchText]);

    const onChange = (event) => {
        setSearchText(event.target.value);
        debouncedUpdate(event.target.value);
    };

    const onKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter') {
                onUpdate(searchText.toLocaleLowerCase());
            }
        },
        [searchText, onUpdate]
    );

    const handleClear = useCallback(() => {
        setSearchText('');
        onClear();
    }, [onClear]);

    return (
        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
            <StyledSearchbar>
                <Input
                    autoFocus
                    disableUnderline
                    fullWidth
                    placeholder="Search…"
                    value={searchText}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    startAdornment={
                        <InputAdornment position="start">
                            <Search sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                        </InputAdornment>
                    }
                    sx={{ mr: 1, fontWeight: 'fontWeightBold' }}
                />
                <Button variant="contained" onClick={handleClear}>
                    Clear
                </Button>
            </StyledSearchbar>
        </Slide>
    );
}
