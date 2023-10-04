import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
// components
import FlowGraph from './FlowGraph';
import OverviewGraph from './OverviewGraph';

GSNGraph.propTypes = {
    selectedVisualizer: PropTypes.string,
    data: PropTypes.array.isRequired,
    filter: PropTypes.shape({
        expandAll: PropTypes.bool,
        highlighted: PropTypes.object,
    }),
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    left: PropTypes.number,
    top: PropTypes.number,
    nonReactive: PropTypes.bool,
    minZoom: PropTypes.number,
    selectedNode: PropTypes.oneOfType([
        PropTypes.shape({
            nodeId: PropTypes.string,
            treeId: PropTypes.string,
        }),
        PropTypes.arrayOf(PropTypes.string),
    ]),
    setSelectedNode: PropTypes.func,
    onConnectNodes: PropTypes.func,
    showReferencesAtStart: PropTypes.bool,
};

export default function GSNGraph({ selectedVisualizer = 'default', data, ...rest }) {
    // TODO: Generalize this at some point..
    const [overviewDisplayed, setOverviewDisplayed] = useState({ default: true, overview: false, overview2: false });

    useEffect(() => {
        if (!overviewDisplayed[selectedVisualizer]) {
            setOverviewDisplayed({ ...overviewDisplayed, [selectedVisualizer]: true });
        }
    }, [selectedVisualizer, overviewDisplayed]);

    return (
        <>
            {overviewDisplayed.overview ? (
                <div style={{ display: selectedVisualizer === 'overview' ? undefined : 'none' }}>
                    <OverviewGraph data={data} {...rest} />
                </div>
            ) : null}
            {overviewDisplayed.overview2 ? (
                <div style={{ display: selectedVisualizer === 'overview2' ? undefined : 'none' }}>
                    <OverviewGraph layout={layout2} data={data} {...rest} />
                </div>
            ) : null}
            <div style={{ display: selectedVisualizer === 'default' ? undefined : 'none' }}>
                <ReactFlowProvider>
                    <FlowGraph data={data} {...rest} />
                </ReactFlowProvider>
            </div>
        </>
    );
}

const layout2 = {
    name: 'cise',
    animate: true,
    allowNodesInsideCircle: false,
    // maxRatioOfNodesInsideCircle: 0.25,
    nodeSeparation: 5,
    clusters: (node) => node.data('clusterId'),
    idealInterClusterEdgeLengthCoefficient: 2,
};
