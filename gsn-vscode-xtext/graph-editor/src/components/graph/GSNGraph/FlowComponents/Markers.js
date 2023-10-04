import PropTypes from 'prop-types';
import { COLORS } from '../../theme';

Marker.propTypes = {
    id: PropTypes.string.isRequired,
    stroke: PropTypes.string.isRequired,
    fill: PropTypes.string.isRequired,
};

function Marker({ id, stroke, fill }) {
    return (
        <marker
            id={id}
            className="react-flow__arrowhead"
            markerWidth="12.5"
            markerHeight="12.5"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
        >
            <polyline
                stroke={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                fill={fill}
                points="-5,-4 0,0 -5,4 -5,-4"
            />
        </marker>
    );
}

export default function Markers() {
    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
            <defs>
                <Marker id="arrowclosed_white_fill" stroke={COLORS.Edge} fill="#ffffff" />
                <Marker id="arrowclosed_white_fill_selected" stroke={COLORS.SELECTED(false)} fill="#ffffff" />
                <Marker
                    id="arrowclosed_white_fill_selected_non_reactive"
                    stroke={COLORS.SELECTED(true)}
                    fill="#ffffff"
                />
                <Marker id="arrowclosed" stroke={COLORS.Edge} fill={COLORS.Edge} />
                <Marker id="arrowclosed_selected" stroke={COLORS.SELECTED(false)} fill={COLORS.SELECTED(false)} />
                <Marker
                    id="arrowclosed_selected_non_reactive"
                    stroke={COLORS.SELECTED(true)}
                    fill={COLORS.SELECTED(true)}
                />
            </defs>
        </svg>
    );
}
