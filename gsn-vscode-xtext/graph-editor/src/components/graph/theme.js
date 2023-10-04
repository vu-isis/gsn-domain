import { createTheme } from '@mui/material/styles';
import {
    yellow,
    blue,
    lime,
    lightBlue,
    green,
    red,
    purple,
    grey,
    indigo,
    teal,
    pink,
    orange,
    brown,
    blueGrey,
} from '@mui/material/colors';

export const COLORS = {
    Goal: blue[700],
    Strategy: green[500],
    Solution: purple[500],
    Context: yellow.A700,
    Assumption: yellow.A700,
    Justification: yellow.A700,
    Choice: grey[600],
    Edge: grey[600],
    GROUP_NODE: red[600],
    UNIVERSE_GROUP_NODE: grey[600],
    DIFF: {
        REMOVED: 'rgb(239, 154, 154, 0.3)',
        ADDED: 'rgb(165, 214, 167, 0.3)',
        MODIFIED: 'rgb(255, 179, 71, 0.8)',
    },
    SELECTED: (nonReactive) => {
        if (nonReactive) {
            return red[800];
        }
        return blue[100];
    },
    HIGHLIGHTED: {},
    FLOW: {
        nodeBackground: {
            dark: '#272727',
            light: '#fff',
        },
        background: {
            dark: '#121212',
            light: '#fff',
        },
        textColor: {
            dark: '#fff',
            light: undefined,
        },
    },
};

const paletteColors = {
    warning: {
        light: yellow.A200,
        main: yellow.A400,
        dark: yellow.A700,
    },
    info: {
        light: lightBlue[100],
        main: lightBlue[200],
        dark: lightBlue[300],
    },
    default: {
        light: grey[500],
        main: grey[600],
        dark: grey[700],
        contrastText: '#fff',
    },
};

const highlightColors = [green, orange, red, indigo, blueGrey, brown, pink, teal, lightBlue, lime];

highlightColors.forEach((color, idx) => {
    paletteColors[`highlight${idx + 1}`] = {
        main: color[800],
        contrastText: '#fff',
    };

    COLORS.HIGHLIGHTED[idx + 1] = { light: color[100], dark: color[700] };
});

function stringToInteger(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        const char = str.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        hash = (hash << 5) - hash + char;
        // eslint-disable-next-line no-bitwise
        hash |= 0; // Convert to a 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Based on the input string deterministically generates a class for a mui-color.
 * @param {string} str
 * @returns
 */
export function getPaletteClassName(str) {
    const colorIdx = (stringToInteger(str) % highlightColors.length) + 1;

    return `highlight${colorIdx}`;
}

export const themeBase = {
    palette: { mode: 'light', ...paletteColors },
    components: {
        MuiButton: {
            styleOverrides: {
                outlined: {
                    backgroundColor: '#fff',
                    '&:hover': {
                        backgroundColor: '#fff',
                    },
                },
            },
        },
    },
    typography: {
        fontSize: 12,
    },
};

export const lightTheme = createTheme(JSON.parse(JSON.stringify(themeBase)));

export const darkTheme = createTheme({
    palette: { mode: 'dark', ...paletteColors },
    components: {
        MuiButton: {
            styleOverrides: {
                outlined: {
                    backgroundColor: '#121212',
                    '&:hover': {
                        backgroundColor: '#121212',
                    },
                },
            },
        },
    },
    typography: {
        fontSize: 12,
    },
});
