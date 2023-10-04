import React, { useState } from 'react';
import ReactFlow, { ReactFlowProvider, Controls } from 'reactflow';

const GraphPage = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [rfInstance, setRfInstance] = useState(null);

    return (
        <div style={{ height: 800, width: '100%' }}>
            <ReactFlowProvider>
                <ReactFlow nodes={nodes} edges={edges} onLoad={(reactFlowInstance) => setRfInstance(reactFlowInstance)}>
                    <Controls />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
};

export default GraphPage;
