import PropTypes from 'prop-types';
import { useContext } from 'react';
import { getBezierPath, getStraightPath } from 'reactflow';
// utils
import FlowContext from '../FlowContext';
import { isReference } from '../../ChangeConfirmation/getDeleteImplications';
import { COLORS } from '../../theme';
import modelUtils from '../../modelUtils';

const pathStyles = (selected, searchString, nonReactive, isRef) => ({
    strokeWidth: selected ? 4 : 2,
    strokeOpacity: searchString ? 0.1 : isRef ? 0.6 : 1,
    stroke: selected ? COLORS.SELECTED(nonReactive) : COLORS.Edge,
});

SolvedBy.propTypes = {
    id: PropTypes.string,
    data: PropTypes.shape({
        modelId: PropTypes.string,
        nonReactive: PropTypes.bool,
    }),
    // Path props
    sourceX: PropTypes.number,
    sourceY: PropTypes.number,
    targetX: PropTypes.number,
    targetY: PropTypes.number,
    sourcePosition: PropTypes.string,
    targetPosition: PropTypes.string,
};

function SolvedBy({ id, data, ...pathProps }) {
    const [edgePath] = getBezierPath({ ...pathProps });
    const { searchString, selectedNodes, showReferences, nonReactive, themeMode } = useContext(FlowContext);
    const selected = selectedNodes.has(data.modelId);

    let isRef = false;

    if (showReferences) {
        const connInfo = modelUtils.tryParseModelIdOfConn(data.modelId);
        isRef = connInfo && isReference(connInfo.srcId, connInfo.dstId);
    }

    let markerEnd = 'url(#arrowclosed)';
    if (selected) {
        markerEnd = 'url(#arrowclosed_selected)';
        if (nonReactive) {
            markerEnd = 'url(#arrowclosed_selected_non_reactive)';
        }
    }

    const midPoint = { x: (pathProps.sourceX + pathProps.targetX) / 2, y: (pathProps.sourceY + pathProps.targetY) / 2 };

    return (
        <>
            <path
                id={id}
                style={pathStyles(selected, searchString, nonReactive, isRef)}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={searchString ? undefined : markerEnd}
            />
            <path d={edgePath} fill="none" strokeWidth={15} />
            {isRef ? (
                <text style={{ fontSize: 12, fill: COLORS.FLOW.textColor[themeMode] }} {...midPoint}>
                    {'ref'}
                </text>
            ) : null}
        </>
    );
}

InContextOf.propTypes = {
    id: PropTypes.string,
    data: PropTypes.shape({
        modelId: PropTypes.string,
    }),
    sourceX: PropTypes.number,
    sourceY: PropTypes.number,
    targetX: PropTypes.number,
    targetY: PropTypes.number,
};

function InContextOf({ id, data, ...pathProps }) {
    const [edgePath] = getStraightPath({ ...pathProps });
    const { searchString, selectedNodes, showReferences, nonReactive, themeMode } = useContext(FlowContext);
    const selected = selectedNodes.has(data.modelId);

    let isRef = false;

    if (showReferences) {
        const connInfo = modelUtils.tryParseModelIdOfConn(data.modelId);
        isRef = connInfo && isReference(connInfo.srcId, connInfo.dstId);
    }

    const midPoint = { x: (pathProps.sourceX + pathProps.targetX) / 2, y: (pathProps.sourceY + pathProps.targetY) / 2 };

    let markerStart = 'url(#arrowclosed_white_fill)';
    if (selected) {
        markerStart = 'url(#arrowclosed_white_fill_selected)';
        if (nonReactive) {
            markerStart = 'url(#arrowclosed_white_fill_selected_non_reactive)';
        }
    }

    return (
        <>
            <path
                id={id}
                style={{ ...pathStyles(selected, searchString, nonReactive, isRef), strokeDasharray: 6 }}
                className="react-flow__edge-path"
                d={edgePath}
                markerStart={searchString ? undefined : markerStart}
            />
            <path d={edgePath} fill="none" strokeWidth={15} />
            {isRef ? (
                <text style={{ fontSize: 12, fill: COLORS.FLOW.textColor[themeMode] }} {...midPoint}>
                    {'ref'}
                </text>
            ) : null}
        </>
    );
}

export default {
    inContextOf: InContextOf,
    solvedBy: SolvedBy,
};
