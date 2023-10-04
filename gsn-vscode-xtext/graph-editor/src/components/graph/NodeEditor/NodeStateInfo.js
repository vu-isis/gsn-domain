import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
// @mui
import { IconButton, Grid, Typography } from '@mui/material';
import {
    LinkOff as LinkOffIcon,
    AddLink as AddLinkIcon,
    Insights as InsightsIcon,
    HourglassTop as HourglassTopIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
// components
import { MultiSelectInput, HyperLink } from '../FormComponents';
import WrapWithLabel from './WrapWithLabel';
// utils
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import { NodeType } from '../gsnTypes';
import { labelStyle } from '../FormComponents/common';

// ----------------------------------------------------------------------

const { SOLUTION_DEPI_STATES, SOLUTION_STATUS_OPTIONS } = GSN_CONSTANTS;

NodeStateInfo.propTypes = {
    nodeData: NodeType,
    isReadOnly: PropTypes.bool,
    onAttributeChange: PropTypes.func,
    depiMethods: PropTypes.shape({
        linkEvidence: PropTypes.func.isRequired,
        unlinkEvidence: PropTypes.func.isRequired,
        getEvidenceInfo: PropTypes.func.isRequired,
        showDependencyGraph: PropTypes.func.isRequired,
        revealEvidence: PropTypes.func.isRequired,
    }),
};

export default function NodeStateInfo({ nodeData, isReadOnly, onAttributeChange, depiMethods }) {
    const [depiState, setDepiState] = useState(SOLUTION_DEPI_STATES.LOADING);
    const [evidence, setEvidence] = useState([]);

    const statusOptions = Object.keys(SOLUTION_STATUS_OPTIONS).map((key) => ({
        value: SOLUTION_STATUS_OPTIONS[key],
        label: SOLUTION_STATUS_OPTIONS[key],
    }));
    // const depiStateOptions = Object.keys(SOLUTION_DEPI_STATES).map((key) => ({
    //     value: SOLUTION_DEPI_STATES[key],
    //     label: SOLUTION_DEPI_STATES[key],
    // }));

    const fetchDepiState = async () => {
        setDepiState(SOLUTION_DEPI_STATES.LOADING);
        const { status, evidence } = await depiMethods.getEvidenceInfo({ nodeId: nodeData.id, uuid: nodeData.uuid });
        setDepiState(status);
        setEvidence(evidence);
    };

    useEffect(() => {
        if (!depiMethods) {
            return;
        }

        fetchDepiState().catch(console.error);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depiMethods, nodeData.id, nodeData.uuid]);

    const actions = useMemo(() => {
        if (!depiMethods) {
            return [];
        }

        const actions = [
            // <br key={'break'} />,
            <IconButton
                key={'Refresh'}
                title={'Refresh Evidence Info'}
                onClick={() => {
                    fetchDepiState().catch(console.error);
                }}
            >
                <RefreshIcon />
            </IconButton>,
        ];

        switch (depiState) {
            case SOLUTION_DEPI_STATES.NO_LINKED_RESOURCE:
                actions.push(
                    <IconButton
                        key={'LinkEvidence'}
                        title={'Link with Evidence'}
                        onClick={() => {
                            depiMethods.linkEvidence({ nodeId: nodeData.id, uuid: nodeData.uuid });
                        }}
                    >
                        <AddLinkIcon />
                    </IconButton>
                );
                break;
            case SOLUTION_DEPI_STATES.RESOURCE_UP_TO_DATE:
            case SOLUTION_DEPI_STATES.RESOURCE_DIRTY:
                actions.push(
                    <IconButton
                        key={'ShowDependencyGraph'}
                        title={'Show Dependency Graph'}
                        onClick={() => {
                            depiMethods.showDependencyGraph({ nodeId: nodeData.id, uuid: nodeData.uuid });
                        }}
                    >
                        <InsightsIcon />
                    </IconButton>,
                    <IconButton
                        key={'ClearLink'}
                        title={'Unlink Evidence'}
                        onClick={() => {
                            depiMethods.unlinkEvidence({ nodeId: nodeData.id, uuid: nodeData.uuid });
                        }}
                    >
                        <LinkOffIcon />
                    </IconButton>
                );
                break;
            case SOLUTION_DEPI_STATES.LOADING:
                actions[1] = (
                    <IconButton key={'Loading..'} disabled title={'Fetching data ...'}>
                        <HourglassTopIcon />
                    </IconButton>
                );
                break;
            default:
                return [];
        }

        return actions;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depiMethods, nodeData.id, nodeData.uuid, depiState]);

    return (
        <Grid container spacing={1} style={{ padding: 10 }}>
            <WrapWithLabel label={'Status'}>
                <MultiSelectInput
                    isReadOnly={isReadOnly}
                    value={nodeData.status || statusOptions[0].value}
                    options={statusOptions}
                    onSubmit={(newValue) => onAttributeChange(nodeData.id, 'status', newValue)}
                />
            </WrapWithLabel>
            {depiMethods ? (
                <>
                    <WrapWithLabel label={'State'}>
                        <Typography style={{ ...labelStyle, color: 'grey' }} variant="body1">
                            {depiState}
                        </Typography>
                        {actions}
                    </WrapWithLabel>
                    {evidence.length > 0 ? (
                        <WrapWithLabel label={'Evidence'}>
                            {evidence.map((resource) => (
                                <HyperLink
                                    key={`${resource.toolId}#${resource.resourceGroupUrl}#${resource.url}`}
                                    title="Reveal Evidence"
                                    value={resource.name}
                                    onClick={() => {
                                        depiMethods.revealEvidence(resource);
                                    }}
                                />
                            ))}
                        </WrapWithLabel>
                    ) : null}
                </>
            ) : null}
        </Grid>
    );
}
