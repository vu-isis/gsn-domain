import { useCallback, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Button, Grid } from '@mui/material';
// form-components
import {
    AutocompleteStringListSelector,
    BooleanInput,
    ChipListValues,
    HyperLink,
    MultiSelectInput,
    StringInput,
} from '../FormComponents';
import WrapWithLabel from './WrapWithLabel';
// utils
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import UserPreferences from '../contexts/UserPreferences';
import { resolveGroupMembers } from '../TopMenu/labelUtils';
import { NodeType, LabelType } from '../gsnTypes';

// ----------------------------------------------------------------------

AttributeForm.propTypes = {
    nodeData: PropTypes.object,
    model: PropTypes.arrayOf(NodeType).isRequired,
    labels: PropTypes.arrayOf(LabelType).isRequired,
    isReadOnly: PropTypes.bool,
    onAttributeChange: PropTypes.func,
    setTopMenuIndex: PropTypes.func.isRequired,
    setSideMenuIndex: PropTypes.func.isRequired,
};

export default function AttributeForm({
    nodeData,
    labels,
    isReadOnly,
    model,
    onAttributeChange,
    setTopMenuIndex,
    setSideMenuIndex,
}) {
    const { enforceUniqueNames } = useContext(UserPreferences);
    const [minReqOpts, parentId, nodeId, infoText] = useMemo(() => {
        let minReqOpts;
        const idParts = nodeData.id.split('/');
        idParts.pop();
        const parentId = idParts.join('/');

        if (typeof nodeData.minimumRequired !== 'number') {
            minReqOpts = [];
        } else {
            minReqOpts = (nodeData[GSN_CONSTANTS.RELATION_TYPES.SOLVED_BY] || []).map((_id, idx) => ({
                value: idx + 1,
                label: `${idx + 1} of ${nodeData[GSN_CONSTANTS.RELATION_TYPES.SOLVED_BY].length}`,
            }));

            minReqOpts.unshift({ value: -1, label: 'None' });
        }

        let infoText;
        if (nodeData.info) {
            infoText = `${nodeData.info.split('/n')[0].substring(0, 30)} ..`;
        } else {
            infoText = 'Add Info text ..';
        }

        return [minReqOpts, parentId, nodeData.id, infoText];
    }, [nodeData]);

    const labelOptionList = useMemo(() => {
        const excludes = new Set(nodeData.labels || []);
        const options = [];
        const labelNameToLabelInfo = {};
        labels.forEach((labelInfo) => {
            labelNameToLabelInfo[labelInfo.name] = labelInfo;
        });

        resolveGroupMembers(labels).forEach((members, groupName) => {
            let groupId = groupName;
            if (groupName !== GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE) {
                let { parent } = labelNameToLabelInfo[groupName];
                while (parent) {
                    groupId = `${parent}:${groupId}`;
                    ({ parent } = labelNameToLabelInfo[parent]);
                }
            }

            members.forEach((labelName) => {
                if (excludes.has(labelName)) {
                    return;
                }

                const desc = labelNameToLabelInfo[labelName].description;
                options.push({
                    id: `${groupId}:${labelName}`,
                    title: `${labelName}${desc ? ` - ${desc}` : ''}`,
                    type: groupId,
                });
            });
        });

        return options.sort((a, b) => a.id.localeCompare(b.id));
    }, [labels, nodeData.labels]);

    const onNameValueChange = useCallback(
        (newName) => {
            const res = { valid: true, hint: '' };

            if (!newName) {
                res.valid = false;
                res.hint = 'Name must be provided.';
            } else if (!GSN_CONSTANTS.NAME_REGEX.test(newName)) {
                res.valid = false;
                res.hint = GSN_CONSTANTS.NAME_REGEX_HINT;
            }

            if (enforceUniqueNames) {
                if (model.some((node) => node.name === newName && node.id !== nodeId)) {
                    res.valid = false;
                    res.hint = `Name already exists - provide a unique name.`;
                }
            } else if (model.some((node) => node.id === [parentId, newName].join('/') && node.id !== nodeId)) {
                res.valid = false;
                res.hint = `New id would already exists - provide a different name.`;
            }

            return res;
        },
        [model, parentId, nodeId, enforceUniqueNames]
    );

    const onInDevelopmentChange = useCallback(
        (isChecked) => {
            onAttributeChange(nodeData.id, 'inDevelopment', isChecked);
        },
        [nodeData, onAttributeChange]
    );

    return (
        <Grid container spacing={1} style={{ padding: 10 }}>
            <WrapWithLabel label={'Name'}>
                <StringInput
                    isReadOnly={isReadOnly}
                    initText={nodeData.name}
                    checkFunction={onNameValueChange}
                    onSubmit={(newValue) => onAttributeChange(nodeData.id, 'name', newValue)}
                />
            </WrapWithLabel>
            {typeof nodeData.summary === 'string' ? (
                <WrapWithLabel label={'Summary'}>
                    <StringInput
                        key={nodeData.id}
                        isReadOnly={isReadOnly}
                        initText={nodeData.summary}
                        rows={3}
                        onSubmit={(newValue) => onAttributeChange(nodeData.id, 'summary', newValue)}
                    />
                </WrapWithLabel>
            ) : null}
            <WrapWithLabel label={'Info'}>
                <HyperLink value={infoText} onClick={() => setSideMenuIndex(1)} />
            </WrapWithLabel>
            {typeof nodeData.minimumRequired === 'number' ? (
                <WrapWithLabel label={'Min Req '}>
                    <MultiSelectInput
                        isReadOnly={isReadOnly}
                        value={nodeData.minimumRequired}
                        options={minReqOpts}
                        onSubmit={(newValue) => onAttributeChange(nodeData.id, 'minimumRequired', newValue)}
                    />
                </WrapWithLabel>
            ) : null}

            {typeof nodeData.inDevelopment === 'boolean' ? (
                <WrapWithLabel label={'In Dev '}>
                    <BooleanInput
                        isReadOnly={isReadOnly}
                        initValue={Boolean(nodeData.inDevelopment)}
                        onSubmit={onInDevelopmentChange}
                    />
                </WrapWithLabel>
            ) : null}
            <WrapWithLabel label={'Labels '}>
                <ChipListValues
                    isReadOnly={isReadOnly}
                    values={nodeData.labels || []}
                    availableValues={labels}
                    onClick={(valToDelete) => {
                        const newValue = (nodeData.labels || []).filter((v) => v !== valToDelete);
                        onAttributeChange(nodeData.id, 'labels', newValue);
                    }}
                />
            </WrapWithLabel>
            {isReadOnly ? null : (
                <WrapWithLabel label={''}>
                    <AutocompleteStringListSelector
                        label={'Add label ..'}
                        options={labelOptionList}
                        onSelect={(labelId) => {
                            const newValue = [...(nodeData.labels || [])];
                            newValue.push(labelId.split(':').pop());
                            onAttributeChange(nodeData.id, 'labels', newValue.sort());
                        }}
                    />
                </WrapWithLabel>
            )}
            <WrapWithLabel>
                <Button variant="text" size="small" onClick={() => setTopMenuIndex(1)}>
                    {`${isReadOnly ? 'SHOW' : 'EDIT'} LABELS ...`}
                </Button>
            </WrapWithLabel>
        </Grid>
    );
}
