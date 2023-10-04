import PropTypes from 'prop-types';
import { useMemo } from 'react';
// @mui
import { Divider } from '@mui/material';
// components
import AttributeForm from './AttributeForm';
import IconHeader from './IconHeader';
import RelationsEditor from './RelationsEditor';
import NoSelectionInfo from './NoSelectionInfo';
import NodeStateInfo from './NodeStateInfo';
import CopyrightVandy from '../CopyrightVandy';
// utils
import modelUtils from '../modelUtils';
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import { NodeType, LabelType } from '../gsnTypes';
import ArtifactsEditor from './ArtifactsEditor';
// -----------------------------------------------------------------------------------------------

NodeEditor.propTypes = {
    model: PropTypes.arrayOf(NodeType).isRequired,
    labels: PropTypes.arrayOf(LabelType).isRequired,
    isReadOnly: PropTypes.bool,
    selectedNode: PropTypes.shape({
        nodeId: PropTypes.string,
        treeId: PropTypes.string,
    }),
    setSelectedNode: PropTypes.func.isRequired,
    setSubtreeRoot: PropTypes.func.isRequired,
    onAttributeChange: PropTypes.func.isRequired,
    onNewChildNode: PropTypes.func.isRequired,
    onDeleteConnection: PropTypes.func.isRequired,
    onDeleteNode: PropTypes.func.isRequired,
    onRevealOrigin: PropTypes.func,
    setTopMenuIndex: PropTypes.func.isRequired,
    setSideMenuIndex: PropTypes.func.isRequired,
    depiMethods: PropTypes.shape({
        linkEvidence: PropTypes.func.isRequired,
        unlinkEvidence: PropTypes.func.isRequired,
        getEvidenceInfo: PropTypes.func.isRequired,
        showDependencyGraph: PropTypes.func.isRequired,
        revealEvidence: PropTypes.func.isRequired,
    }),
};

export default function NodeEditor({
    model,
    labels,
    isReadOnly,
    selectedNode,
    setSelectedNode,
    setSubtreeRoot,
    onAttributeChange,
    onNewChildNode,
    onDeleteNode,
    onDeleteConnection,
    onRevealOrigin,
    setTopMenuIndex,
    setSideMenuIndex,
    depiMethods,
}) {
    const { nodeData, connData } = useMemo(() => {
        let nodeData = null;
        let connData = null;
        const { nodeId } = selectedNode;
        if (nodeId) {
            nodeData = model.find((n) => n.id === nodeId);
            if (!nodeData) {
                connData = modelUtils.tryParseModelIdOfConn(nodeId);
            }
        }

        return { nodeData, connData };
    }, [selectedNode, model]);

    if (nodeData) {
        return (
            <>
                <IconHeader
                    nodeData={nodeData}
                    isReadOnly={isReadOnly}
                    onDeleteNode={onDeleteNode}
                    setSubtreeRoot={setSubtreeRoot}
                    onRevealOrigin={onRevealOrigin}
                />
                <Divider />
                <AttributeForm
                    nodeData={nodeData}
                    labels={labels}
                    isReadOnly={isReadOnly}
                    model={model}
                    onAttributeChange={onAttributeChange}
                    setTopMenuIndex={setTopMenuIndex}
                    setSideMenuIndex={setSideMenuIndex}
                />
                {depiMethods ? null : (
                    <ArtifactsEditor
                        nodeData={nodeData}
                        isReadOnly={isReadOnly}
                        onAttributeChange={onAttributeChange}
                    />
                )}
                {nodeData.type === GSN_CONSTANTS.TYPES.SOLUTION ? (
                    <>
                        <NodeStateInfo
                            nodeData={nodeData}
                            isReadOnly={isReadOnly}
                            model={model}
                            onAttributeChange={onAttributeChange}
                            depiMethods={depiMethods}
                        />
                    </>
                ) : null}
                <Divider />
                <RelationsEditor
                    nodeId={selectedNode.nodeId}
                    isReadOnly={isReadOnly}
                    model={model}
                    setSelectedNode={setSelectedNode}
                    onNewChildNode={onNewChildNode}
                    onDeleteConnection={onDeleteConnection}
                />
                <CopyrightVandy />
            </>
        );
    }

    if (connData) {
        return (
            <>
                <IconHeader nodeData={connData} isReadOnly={isReadOnly} onDeleteConnection={onDeleteConnection} />
                <Divider />
                <CopyrightVandy />
            </>
        );
    }

    return <NoSelectionInfo />;
}
