import { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import defaultExample from '../examples/control_system';

const MAX_COMMITS = 100;
const LOCAL_STORAGE_MODEL_KEY = 'gsnModel';
const LOCAL_STORAGE_COMMITS_KEY = 'gsnCommits';
const LOCAL_STORAGE_VIEWS_KEY = 'gsnViews';
const LOCAL_STORAGE_LABELS_KEY = 'gsnLabels';

const DEFAULT_LABELS_STRUCTURE = [
    {
        isGroup: false,
        name: 'MyLabel',
        description: 'Example label',
    },
    {
        isGroup: true,
        name: 'MyLabelGroup',
        parent: null,
        members: [],
    },
    {
        isGroup: true,
        name: 'SubGroup',
        parent: 'MyLabelGroup',
        members: ['MyLabel'],
    },
];

const parseLocalStorage = (key, fallbackValue) => {
    try {
        const storageStr = localStorage.getItem(key);
        if (!storageStr) {
            return fallbackValue;
        }

        return JSON.parse(storageStr);
    } catch (err) {
        console.error('Could not parse local-storage', key);
        return fallbackValue;
    }
};

// The initial state, you can setup any properties initilal values here.
const initialState = {
    modelName: 'Local Storage',
    isReadOnly: false,
    currentCommit: null,
    searchString: '',
    views: parseLocalStorage(LOCAL_STORAGE_VIEWS_KEY, []),
    labels: parseLocalStorage(LOCAL_STORAGE_LABELS_KEY, DEFAULT_LABELS_STRUCTURE),
    model: parseLocalStorage(LOCAL_STORAGE_MODEL_KEY, defaultExample),
    commits: parseLocalStorage(LOCAL_STORAGE_COMMITS_KEY, []),
};

const storeNewState = (model, commits) => {
    setTimeout(() => {
        if (model) localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, JSON.stringify(model));
        if (commits) localStorage.setItem(LOCAL_STORAGE_COMMITS_KEY, JSON.stringify(commits));
    });
};

const GlobalContext = createContext(null);

GlobalState.propTypes = {
    children: PropTypes.any,
};

export function GlobalState({ children }) {
    const [globalState, setGlobalState] = useState(initialState);

    const updateGlobalState = (key, newValue, commit) => {
        setGlobalState((oldState) => {
            if (oldState[key] !== newValue) {
                const newState = { ...oldState };
                if (key === 'model') {
                    newState.model = newValue;
                    if (newState.isReadOnly) {
                        return newState;
                    }

                    if (commit) {
                        newState.commits = [commit, ...oldState.commits];

                        if (newState.commits > MAX_COMMITS) {
                            newState.commits.pop();
                        }

                        // newState.currentCommit = commit.id;
                    } else {
                        console.error('No commit provided when updating model!');
                        newState.commits = [];
                    }

                    storeNewState(newState.model, newState.commits);
                } else if (key === 'commits') {
                    newState[key] = newValue;
                    storeNewState(null, newState.commits);
                } else if (key === 'views') {
                    newState[key] = newValue;
                    localStorage.setItem(LOCAL_STORAGE_VIEWS_KEY, JSON.stringify(newState[key]));
                } else if (key === 'labels') {
                    newState[key] = newValue;
                    localStorage.setItem(LOCAL_STORAGE_LABELS_KEY, JSON.stringify(newState[key]));
                } else {
                    newState[key] = newValue;
                }

                return newState;
            }

            return oldState;
        });
    };

    return <GlobalContext.Provider value={[globalState, updateGlobalState]}>{children}</GlobalContext.Provider>;
}

// custom hook for retrieving the provided state
export const useGlobalState = () => useContext(GlobalContext);
