import PropTypes from 'prop-types';
import { useContext } from 'react';
import { Handle, Position, useStore } from 'reactflow';
import { Button } from '@mui/material';
// utils
import FlowContext from '../FlowContext';
import { COLORS } from '../../theme';
import GSN_CONSTANTS from '../../GSN_CONSTANTS';
import { ChipListValues } from '../../FormComponents';

const { STRATEGY, CONTEXT, ASSUMPTION, JUSTIFICATION } = GSN_CONSTANTS.TYPES;

// Helpers
export const isOverview = (zoom) => zoom < 0.65;

Header.propTypes = {
    label: PropTypes.string,
    zoom: PropTypes.number,
    sx: PropTypes.object,
    minimumFontSize: PropTypes.number,
};

export function Header({ label, zoom, sx = {}, minimumFontSize = 0 }) {
    let fontSize = Math.round(14 / zoom);
    const overview = isOverview(zoom);
    if (!overview && zoom < 1) {
        fontSize = 14;
    } else if (overview) {
        if (zoom > 0.5) {
            fontSize = 16;
        } else {
            fontSize = 20;
        }
    }

    fontSize = fontSize < minimumFontSize ? minimumFontSize : fontSize;

    return (
        <div
            style={{
                fontWeight: 'bold',
                paddingLeft: 10,
                paddingRight: 10,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                paddingTop: overview ? 30 : 5,
                paddingBottom: overview ? 0 : 4,
                fontSize,
                display: overview ? '-webkit-box' : undefined,
                wordWrap: overview ? 'break-word' : undefined,
                WebkitLineClamp: overview ? 3 : undefined,
                WebkitBoxOrient: overview ? 'vertical' : undefined,
                ...sx,
            }}
        >
            {label}
        </div>
    );
}

const fontSizeToMaxLines = (ellipsis) => ({
    12: ellipsis ? 4 : 6,
    11: ellipsis ? 5 : 7,
    10: ellipsis ? 6 : 8,
    9: ellipsis ? 6 : 9,
    8: ellipsis ? 7 : 10,
    7: ellipsis ? 10 : 13,
    6: ellipsis ? 12 : 16,
});

Summary.propTypes = {
    summary: PropTypes.string,
    zoom: PropTypes.number,
    sx: PropTypes.object,
    ellipsis: PropTypes.bool,
    minimumFontSize: PropTypes.number,
};
export function Summary({ summary, zoom, sx = {}, ellipsis = false, minimumFontSize = 6 }) {
    let fontSize = zoom < 1 ? 12 : Math.round(12 / zoom);
    fontSize = fontSize < minimumFontSize ? minimumFontSize : fontSize;

    const WebkitLineClamp = fontSizeToMaxLines(ellipsis)[fontSize];

    return (
        <div
            style={{
                fontSize,
                lineHeight: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: isOverview(zoom) ? 'none' : '-webkit-box',
                whiteSpace: 'normal',
                WebkitLineClamp,
                WebkitBoxOrient: 'vertical',
                padding: 5,
                paddingBottom: 0,
                paddingTop: 0,
                ...sx,
            }}
        >
            {summary}
        </div>
    );
}

const actionBtnStyle = (isTop, overview, collapseBtn, themeMode) => ({
    '--width': overview ? (collapseBtn ? '42px' : '64px') : '20px',
    position: 'absolute',
    bottom: isTop ? undefined : -14,
    top: isTop ? -14 : undefined,
    left: 'calc( 50% - var(--width) / 2 )',
    height: overview ? undefined : 18,
    minWidth: 'var(--width)',
    maxWidth: 'var(--width)',
    background: overview ? undefined : COLORS.FLOW.nodeBackground[themeMode],
    fontWeight: 'bold',
    fontSize: overview ? 18 : undefined,
});

ExpandBtns.propTypes = {
    id: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool,
    contextsExpanded: PropTypes.bool,
    solvedByCount: PropTypes.number,
    inContextOfCount: PropTypes.number,
    onExpand: PropTypes.func.isRequired,
    zoom: PropTypes.number,
    themeMode: PropTypes.string.isRequired,
};

function ExpandBtns({ id, isExpanded, contextsExpanded, onExpand, solvedByCount, inContextOfCount, zoom, themeMode }) {
    const overview = isOverview(zoom);
    return (
        <>
            {inContextOfCount > 0 ? (
                <Button
                    className="do-not-print"
                    size="small"
                    variant={overview ? 'contained' : 'outlined'}
                    color={contextsExpanded ? 'info' : 'warning'}
                    style={actionBtnStyle(true, overview, contextsExpanded, themeMode)}
                    onClick={(event) => {
                        onExpand(id, !contextsExpanded, true, event.ctrlKey);
                        event.stopPropagation();
                    }}
                >
                    {contextsExpanded ? '-' : `${inContextOfCount}`}
                </Button>
            ) : null}
            {solvedByCount > 0 ? (
                <Button
                    className="do-not-print"
                    size="small"
                    variant={overview ? 'contained' : 'outlined'}
                    color={isExpanded ? 'info' : 'primary'}
                    style={actionBtnStyle(false, overview, isExpanded, themeMode)}
                    onClick={(event) => {
                        onExpand(id, !isExpanded, false, event.ctrlKey);
                        event.stopPropagation();
                    }}
                >
                    {isExpanded ? '-' : `${solvedByCount}`}
                </Button>
            ) : null}
        </>
    );
}

const commonStyles = (selected, hidden, nonReactive, highlighted, themeMode) => ({
    background: highlighted ? COLORS.HIGHLIGHTED[highlighted][themeMode] : COLORS.FLOW.nodeBackground[themeMode],
    boxShadow: selected ? `0 0 10px 10px ${COLORS.SELECTED(nonReactive)}` : undefined,
    textAlign: 'center',
    borderStyle: 'solid',
    opacity: hidden ? '0.1' : undefined,
    height: 120,
    color: COLORS.FLOW.textColor[themeMode],
});

function isHiddenInSearch(searchString, data) {
    if (!searchString) {
        return false;
    }

    const ss = searchString.toLowerCase();
    return !(
        data.node.name.toLowerCase().includes(ss) ||
        (data.node.summary || data.node.info || '').toLowerCase().includes(ss)
    );
}

export const zoomSelector = (s) => s.transform[2];

// Node-types
const nodePropTypes = {
    id: PropTypes.string,
    data: PropTypes.shape({
        modelId: PropTypes.string,
        node: PropTypes.object,
        searchString: PropTypes.string,
        onExpand: PropTypes.func,
        isExpanded: PropTypes.bool,
        contextsExpanded: PropTypes.bool,
        solvedBy: PropTypes.arrayOf(PropTypes.string),
        inContextOf: PropTypes.arrayOf(PropTypes.string),
        minimumRequired: PropTypes.number,
    }),
    type: PropTypes.string.isRequired,
};

Goal.propTypes = nodePropTypes;

function Goal({ id, data, type }) {
    const { searchString, selectedNodes, nonReactive, highlightedNodes, showLabels, themeMode } =
        useContext(FlowContext);
    const highlighted = highlightedNodes && highlightedNodes[data.modelId] && highlightedNodes[data.modelId].highlight;
    const selected = selectedNodes.has(data.modelId);
    const hidden =
        isHiddenInSearch(searchString, data) ||
        (highlightedNodes && highlightedNodes[data.modelId] && highlightedNodes[data.modelId].hidden);
    const zoom = useStore(zoomSelector);

    return (
        <div
            style={{
                ...commonStyles(selected, hidden, nonReactive, highlighted, themeMode),
                borderColor: COLORS[type],
                transform: type === STRATEGY ? 'skew(-10deg)' : undefined,
                width: 180,
            }}
        >
            <div
                style={{
                    transform: type === STRATEGY ? 'skew(10deg)' : undefined,
                    height: '100%',
                    width: '100%',
                }}
            >
                <Handle type="target" position={Position.Top} />
                <Header label={data.node.name} zoom={zoom} />
                <Summary summary={data.node.summary || data.node.info} zoom={zoom} />
                <Handle type="source" position={Position.Bottom} />
                {nonReactive ? null : (
                    <ExpandBtns
                        id={id}
                        onExpand={data.onExpand}
                        isExpanded={data.isExpanded}
                        contextsExpanded={data.contextsExpanded}
                        solvedByCount={data.solvedBy.length}
                        inContextOfCount={data.inContextOf.length}
                        zoom={zoom}
                        themeMode={themeMode}
                    />
                )}
                {showLabels ? (
                    <div>
                        <ChipListValues isReadOnly values={data.node.labels} variant="contained" noValuesMessage="" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

Context.propTypes = nodePropTypes;
// eslint-disable-next-line no-unused-vars
function Context({ id, data, type }) {
    const { searchString, selectedNodes, nonReactive, highlightedNodes, showLabels, themeMode } =
        useContext(FlowContext);
    const highlighted = highlightedNodes && highlightedNodes[data.modelId] && highlightedNodes[data.modelId].highlight;
    const selected = selectedNodes.has(data.modelId);
    const hidden =
        isHiddenInSearch(searchString, data) ||
        (highlightedNodes && highlightedNodes[data.modelId] && highlightedNodes[data.modelId].hidden);
    const zoom = useStore(zoomSelector);
    const sxSummary = {};
    const sxHeader = {};

    const ellipsis = type !== CONTEXT;

    let typeTag = null;

    if (type === ASSUMPTION) {
        typeTag = 'A';
    }

    if (type === JUSTIFICATION) {
        typeTag = 'J';
    }

    if (ellipsis) {
        const overview = isOverview(zoom);
        sxSummary.paddingLeft = 20;
        sxSummary.paddingRight = 20;
        sxHeader.paddingTop = overview ? 30 : 15;
        sxHeader.paddingLeft = overview ? 10 : 30;
        sxHeader.paddingRight = overview ? 10 : 30;
    }

    return (
        <div
            style={{
                ...commonStyles(selected, hidden, nonReactive, highlighted, themeMode),
                borderColor: COLORS[type],
                width: ellipsis ? 200 : 180,
                borderRadius: ellipsis ? '50%' : '15%',
            }}
        >
            <Handle type="source" position={Position.Bottom} />
            <Header label={data.node.name} zoom={zoom} type={type} sx={sxHeader} />
            <Summary
                summary={data.node.summary || data.node.info}
                zoom={zoom}
                type={type}
                ellipsis={ellipsis}
                sx={sxSummary}
            />
            {typeTag ? (
                <div style={{ position: 'absolute', fontWeight: 'bold', bottom: 5, right: 5 }}>{typeTag}</div>
            ) : null}
            {showLabels ? (
                <div>
                    <ChipListValues isReadOnly values={data.node.labels} variant="contained" noValuesMessage="" />
                </div>
            ) : null}
        </div>
    );
}

Solution.propTypes = nodePropTypes;
// eslint-disable-next-line no-unused-vars
function Solution({ id, data, type }) {
    const { searchString, selectedNodes, nonReactive, highlightedNodes, showLabels, themeMode } =
        useContext(FlowContext);
    const highlighted = highlightedNodes && highlightedNodes[data.modelId] && highlightedNodes[data.modelId].highlight;
    const selected = selectedNodes.has(data.modelId);
    const hidden =
        isHiddenInSearch(searchString, data) ||
        (highlightedNodes && highlightedNodes[data.modelId] && highlightedNodes[data.modelId].hidden);
    const zoom = useStore(zoomSelector);

    return (
        <div
            style={{
                ...commonStyles(selected, hidden, nonReactive, highlighted, themeMode),
                borderColor: COLORS[type],
                borderRadius: '20%',
                width: 140,
            }}
        >
            <Handle type="target" position={Position.Top} />
            <Header label={data.node.name} zoom={zoom} type={type} />
            <Summary summary={data.node.summary || data.node.info} zoom={zoom} type={type} />
            {showLabels ? (
                <div>
                    <ChipListValues isReadOnly values={data.node.labels} variant="contained" noValuesMessage="" />
                </div>
            ) : null}
        </div>
    );
}

export default {
    Goal,
    Strategy: Goal,
    Solution,
    Context,
    Assumption: Context,
    Justification: Context,
};
