import { useState, useEffect, useMemo } from 'react';
import { applyPatches } from 'immer';
// @mui
import { FormControlLabel, Switch } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
// components
import GSNAppInMemory from './components/graph/GSNAppInMemory';
import TextEditor from './TextEditor';
import { lightTheme, darkTheme } from './components/graph/theme';
import CompareView from './components/graph/CompareView';

// hooks
import { useGlobalState } from './hooks/useGlobalState';
// ----------------------------------------------------------------------

export default function App() {
    const [globalState, updateGlobalState] = useGlobalState();
    const { model, views, labels, isReadOnly, searchString } = globalState;
    const [size, setSize] = useState({ height: 0, width: 0 });
    const [textEditorStateType, setTextEditorStateType] = useState('');
    const [darkMode, setDarkMode] = useState(localStorage.getItem('dark-mode') === 'true');
    const [showCompare, setShowCompare] = useState(localStorage.getItem('show-compare') === 'true');

    const { oldModel, newModel } = useMemo(() => {
        if (!showCompare) {
            return { oldModel: [], newModel: [] };
        }

        const newModel = globalState.model;
        let oldModel = newModel;
        // eslint-disable-next-line no-restricted-syntax
        for (const commit of globalState.commits) {
            oldModel = applyPatches(oldModel, commit.invPatches);
        }

        return { newModel, oldModel };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showCompare]);

    useEffect(() => {
        function handleResize() {
            const { innerWidth, innerHeight } = window;
            setSize({ width: innerWidth, height: innerHeight });
        }

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                setTextEditorStateType('model');
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                setTextEditorStateType('labels');
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('keydown', handleKeyDown);
        // Invoke once at start-up.
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const onSetDarkMode = (event) => {
        localStorage.setItem('dark-mode', event.target.checked);
        setDarkMode(event.target.checked);
    };

    const onSetShowCompare = (event) => {
        localStorage.setItem('show-compare', event.target.checked);
        setShowCompare(event.target.checked);
    };

    return (
        <div
            id="graph-container"
            style={{ height: '100vh', width: '100vw', backgroundColor: darkMode ? '#121212' : '#fff' }}
        >
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
                {showCompare ? (
                    <CompareView newModel={newModel} oldModel={oldModel} />
                ) : (
                    <GSNAppInMemory
                        isReadOnly={isReadOnly}
                        width={size.width}
                        height={size.height}
                        model={model}
                        views={views}
                        labels={labels}
                        searchString={searchString}
                        updateGlobalState={updateGlobalState}
                    />
                )}
                {textEditorStateType ? (
                    <TextEditor
                        stateType={textEditorStateType}
                        onClose={() => {
                            setTextEditorStateType('');
                        }}
                    />
                ) : null}
                {/* <FormControlLabel
                    style={{ position: 'absolute', top: 0, left: 440 }}
                    control={<Switch checked={darkMode} onChange={onSetDarkMode} color="primary" />}
                    label="Dark mode"
                />
                <FormControlLabel
                    style={{ position: 'absolute', top: 0, left: 600 }}
                    control={<Switch checked={showCompare} onChange={onSetShowCompare} color="primary" />}
                    label="Compare"
                /> */}
            </ThemeProvider>
        </div>
    );
}
