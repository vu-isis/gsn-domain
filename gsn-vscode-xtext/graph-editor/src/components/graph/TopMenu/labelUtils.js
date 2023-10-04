import GSN_CONSTANTS from '../GSN_CONSTANTS';
import { tryParseLabelsFromViewExpression } from './ViewEditor/viewUtils';

const reservedChars = Object.keys(GSN_CONSTANTS.LOGICAL_SYMBOLS).map((key) => GSN_CONSTANTS.LOGICAL_SYMBOLS[key]);

/**
 * Resolves the members of a group based on its children groups.
 *
 * @param {string[]} labels - An array of label information objects. Each object should contain
 *                         'name', 'isGroup', 'members', and 'parent' properties.
 * @param {boolean} [onlyInheritedMembers=false] - If true, only includes inherited members
 *                                                 in the resulting map. If false or not provided,
 *                                                 includes direct members as well.
 * @returns {Map<string, Set<string>>} - Returns a Map where keys are group names (string) and
 *                                       values are Sets of group members (string). The universe ('*') group is alwasys included.
 */
export function resolveGroupMembers(labels, onlyInheritedMembers = false) {
    const groupToLabels = new Map([[GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE, new Set()]]);

    // Find all groups and populate direct members.
    const groups = new Map();
    labels.forEach((labelInfo) => {
        if (labelInfo.isGroup) {
            groupToLabels.set(labelInfo.name, new Set(onlyInheritedMembers ? [] : labelInfo.members));
            groups.set(labelInfo.name, labelInfo);
        } else {
            groupToLabels.get(GSN_CONSTANTS.LOGICAL_SYMBOLS.UNIVERSE).add(labelInfo.name);
        }
    });

    // Go through all groups and propagate members up to parents.
    groups.forEach((groupInfo) => {
        while (groupInfo.parent) {
            const parentLabels = groupToLabels.get(groupInfo.parent);
            groupInfo.members.forEach((label) => parentLabels.add(label));
            groupInfo = groups.get(groupInfo.parent);
        }
    });

    return groupToLabels;
}

export function getLabelUsageCounts(model, views) {
    const result = {
        inNodesCount: null,
        inViewsCount: null,
    };

    if (model) {
        result.inNodesCount = {};
        model.forEach((node) => {
            if (!node.labels) {
                return;
            }

            node.labels.forEach((labelName) => {
                if (!result.inNodesCount[labelName]) {
                    result.inNodesCount[labelName] = 0;
                }

                result.inNodesCount[labelName] += 1;
            });
        });
    }

    if (views) {
        result.inViewsCount = {};
        views
            .map((view) => tryParseLabelsFromViewExpression(view.expression))
            .forEach((labelNames) => {
                labelNames.forEach((labelName) => {
                    if (!result.inViewsCount[labelName]) {
                        result.inViewsCount[labelName] = 0;
                    }

                    result.inViewsCount[labelName] += 1;
                });
            });
    }

    return result;
}

/**
 * @typedef {object} ValidationResult
 * @property {boolean} valid - Whether the input is valid or not.
 * @property {string} hint - A hint describing the error if the input is invalid, empty if the input is valid.
 */

/**
 * Validates if the given name is a valid label/group name.
 *
 * This function checks for specific reserved characters in the name and validates the name against a predefined regex.
 * If the name includes any of the reserved characters or doesn't match the regex, the function returns an object with
 * the valid property set to false and a hint describing the error. If the name is valid, the function returns an object
 * with the valid property set to true and an empty hint.
 *
 * @param {string} name - The name to be validated.
 * @returns {ValidationResult} result - The validation result.
 */
export function isValidLabelOrGroupName(name) {
    let invalid = false;

    if (!name) {
        return { valid: false, hint: 'Cannot be an empty.' };
    }

    reservedChars.forEach((chars) => {
        invalid = invalid || name.includes(chars);
    });

    if (invalid) {
        return {
            valid: false,
            hint: `Cannot contain ${reservedChars.map((str) => `"${str}"`).join(', ')}.`,
        };
    }

    if (!GSN_CONSTANTS.LABEL_REGEX.test(name)) {
        return {
            valid: false,
            hint: GSN_CONSTANTS.LABEL_REGEX_HINT,
        };
    }

    return { valid: true, hint: '' };
}

const getNameRemoverFn = (name) => (arr) => arr.filter((n) => n !== name);
const getNameReplacerFn = (newName, oldName) => (arr) => arr.map((n) => (n === oldName ? newName : n));

/**
 * @typedef {object} LabelAttributeChange
 * @property {string} nodeId - Id of affected node.
 * @property {string[]} newValue - New array of labels.
 */

function _getLabelChangeImplication(model, name, getNewValue) {
    const result = [];
    model.forEach((node) => {
        if (!node.labels) {
            return;
        }

        if (node.labels.includes(name)) {
            result.push({
                nodeId: node.id,
                newValue: getNewValue(node.labels),
            });
        }
    });

    return result;
}

/**
 * Calculates the implications of deleting a label from the model.
 *
 * This function iterates over the model and for each node, if the node's labels include the given name,
 * it creates a new LabelAttributeChange object where the new value is the node's labels without the deleted label.
 * The function returns an array of these LabelAttributeChange objects.
 *
 * @param {object[]} model - The model to process.
 * @param {string} name - The name of the label to delete.
 * @returns {LabelAttributeChange[]} An array of LabelAttributeChange objects representing the implications of the
 *  delete operation.
 */
export function getDeleteLabelImplications(model, name) {
    return _getLabelChangeImplication(model, name, getNameRemoverFn(name));
}

/**
 * Calculates the implications of renaming a label in the model.
 *
 * This function iterates over the model and for each node, if the node's labels include the old label name,
 * it creates a new LabelAttributeChange object where the new value is the node's labels with the old label name
 * replaced by the new name.
 * The function returns an array of these LabelAttributeChange objects.
 *
 * @param {object[]} model - The model to process.
 * @param {string} newName - The new name for the label.
 * @param {string} oldName - The old name of the label.
 * @returns {LabelAttributeChange[]} An array of LabelAttributeChange objects representing the implications of the
 *  rename operation.
 */
export function getRenameLabelImplications(model, newName, oldName) {
    return _getLabelChangeImplication(model, oldName, getNameReplacerFn(newName, oldName));
}

export function getNewLabelsAfterDeletion(labels, name) {
    const newLabels = [];

    const { isGroup } = labels.find((label) => label.name === name);

    labels.forEach((label) => {
        if (label.name === name) {
            // The deleted label..
            return;
        }

        if (!label.isGroup) {
            newLabels.push(label);
        } else if (isGroup && label.parent === name) {
            newLabels.push({ ...label, parent: null });
        } else if (!isGroup && label.members.includes(name)) {
            // Filter out the label from members.
            newLabels.push({ ...label, members: getNameRemoverFn(name)(label.members) });
        } else {
            newLabels.push(label);
        }
    });

    return newLabels;
}

export function getNewLabelsAfterRenaming(labels, newLabel, oldName) {
    const { isGroup } = labels.find((label) => label.name === oldName);

    return labels.map((label) => {
        if (label.name === oldName) {
            // The renamed label..
            return newLabel;
        }

        if (!label.isGroup) {
            return label;
        }

        if (isGroup && label.parent === oldName) {
            return { ...label, parent: newLabel.name };
        }

        if (!isGroup && label.members.includes(oldName)) {
            // Filter out the label from members.
            return { ...label, members: getNameReplacerFn(newLabel.name, oldName)(label.members) };
        }

        return label;
    });
}
