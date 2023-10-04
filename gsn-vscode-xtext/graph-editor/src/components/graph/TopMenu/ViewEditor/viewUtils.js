import modelUtils from '../../modelUtils';
import { resolveGroupMembers } from '../labelUtils';
import GSN_CONSTANTS from '../../GSN_CONSTANTS';

const { LOGICAL_SYMBOLS } = GSN_CONSTANTS;

/**
 * Tries to parse a view expression string and returns a list of label objects grouped
 * by their respective logical ORs. Expands groups to an expression of ORs between the members.
 *
 * @param {string} str The view expression string.
 * @param {object[]} labelData Array of all label- and group-definitions.
 * @returns {array<object[]>} A list of label objects grouped by their respective logical OR's.
 * @throws {Error} If a sub-expression is empty or a negate operator is used at the wrong position.
 */
export const tryParseViewExpression = (str, labelData) => {
    const result = [];

    const groupToMembers = resolveGroupMembers(labelData);

    if (!str) {
        // No expression matches everything.
        return result;
    }

    str.split(LOGICAL_SYMBOLS.OR).forEach((subExpress) => {
        if (!subExpress) {
            throw new Error('Sub-expressions cannot be empty!');
        }

        const entry = [];

        subExpress.split(LOGICAL_SYMBOLS.AND).forEach((expr) => {
            if (!expr.trim() || expr.trim() === LOGICAL_SYMBOLS.NOT) {
                throw new Error('Sub-expressions cannot be empty!');
            }

            const andEntry = {
                label: expr.trim(),
                labels: null,
                isNegated: false,
            };

            if (andEntry.label.startsWith(LOGICAL_SYMBOLS.NOT)) {
                andEntry.isNegated = true;
                andEntry.label = andEntry.label.substring(1).trim();
            }

            if (andEntry.label.includes(LOGICAL_SYMBOLS.NOT)) {
                throw new Error(`Negate-operator (${LOGICAL_SYMBOLS.NOT}) can only be used before a label.`);
            }

            if (groupToMembers.has(andEntry.label)) {
                andEntry.labels = [...groupToMembers.get(andEntry.label)];
            }

            entry.push(andEntry);
        });

        result.push(entry);
    });

    return result;
};

/**
 * Tries to parse a view expression string and returns a set of label/group names.
 *
 * @param {string} str The view expression string.
 * @returns {Set<string>} A set of label/group names.
 * @throws {Error} If a sub-expression is empty or a negate operator is used at the wrong position.
 */
export const tryParseLabelsFromViewExpression = (str) => {
    const result = new Set();

    if (!str) {
        return result;
    }

    str.split(LOGICAL_SYMBOLS.OR).forEach((subExpress) => {
        if (!subExpress) {
            throw new Error('Sub-expressions cannot be empty!');
        }

        subExpress.split(LOGICAL_SYMBOLS.AND).forEach((expr) => {
            if (!expr.trim() || expr.trim() === LOGICAL_SYMBOLS.NOT) {
                throw new Error('Sub-expressions cannot be empty!');
            }

            let label = expr.trim();

            if (label.startsWith(LOGICAL_SYMBOLS.NOT)) {
                label = label.substring(1).trim();
            }

            if (label.includes(LOGICAL_SYMBOLS.NOT)) {
                throw new Error(`Negate-operator (${LOGICAL_SYMBOLS.NOT}) can only be used before a label.`);
            }

            result.add(label);
        });
    });

    return result;
};

/**
 * Evaluates a view expression using the given set of labels and returns the resulting boolean value.
 *
 * @param {array<object[]>} expression A list of label objects grouped by their respective logical OR's.
 * @param {string[]} labels A set of labels.
 * @returns {boolean} The boolean result of evaluating the expression.
 */
export const evaluateViewExpression = (expression, labels) => {
    if (expression.length === 0) {
        return true;
    }
    return (
        expression
            .map((or) =>
                or
                    .map((and) => {
                        // Case of a group substitution.
                        if (and.labels) {
                            // eslint-disable-next-line no-restricted-syntax
                            for (const label of and.labels) {
                                const match = labels.includes(label);
                                // Only one needs to match to be true.
                                if (!and.isNegated && match) {
                                    return 1;
                                }

                                // Only one needs to match to be false.
                                if (and.isNegated && match) {
                                    return 0;
                                }
                            }

                            // No match.
                            return and.isNegated ? 1 : 0;
                        }

                        if (labels.includes(and.label)) {
                            return and.isNegated ? 0 : 1;
                        }

                        return and.isNegated ? 1 : 0;
                    })
                    .reduce((product, val) => product * val, 1)
            )
            .reduce((sum, val) => sum + val, 0) > 0
    );
};

/**
 * Applies the active view to the given model and returns the resulting sub-tree or nodes.
 *
 * @param {object[]} model The model to apply the view on.
 * @param {object[]} labelData Array of all label- and group-definitions.
 * @param {object} activeView The active view object.
 * @param {string} activeView.expression The expression used to find direct-matches
 * @param {boolean} activeView.includeParents Optionally includes parents for direct-matches.
 * @param {boolean} activeView.includeSubtrees Optionally includes sub-tress for direct-matches.
 * @param {object} [idToNode=null] A dictionary containing node objects with their respective node ids as keys.
 * @returns {object[]} The resulting sub-tree or nodes after applying the view.
 */
export const applyViewToModel = (model, labelData, activeView, idToNode = null) => {
    if (!activeView.expression) {
        return model;
    }

    // const dt = Date.now();
    // Build dictionary if not provided.
    if (!idToNode) {
        idToNode = modelUtils.getIdToNodeMap(model);
    }

    const parsedExpression = tryParseViewExpression(activeView.expression, labelData);
    const directMatches = model.filter((n) => evaluateViewExpression(parsedExpression, n.labels || []));

    const additionalNodes = new Set();

    if (activeView.includeParents || activeView.includeSubtrees) {
        directMatches.forEach((n) => {
            // FIXME: This can be optimized by keeping track of visited nodes.
            if (activeView.includeSubtrees) {
                const { children } = modelUtils.getChildIds(model, n.id, idToNode, true);
                Object.keys(children).forEach((id) => additionalNodes.add(id));
            }

            if (activeView.includeParents) {
                const { parents } = modelUtils.getParentIds(model, n.id, idToNode);
                Object.keys(parents).forEach((id) => additionalNodes.add(id));
            }
        });
    }

    let result = directMatches;
    if (additionalNodes.size > 0) {
        // FIXME: Consider using sets for directmatches.
        result = model.filter((n) => directMatches.some((dN) => n.id === dN.id) || additionalNodes.has(n.id));
    }

    // console.log('Time to run applyViewToModel ', Date.now() - dt, '[ms]');
    return result;
};

/**
 * @typedef {object} CheckResult
 * @property {boolean} valid - True is valid false if not.
 * @property {string} hint - If invalid the reason why.
 */

/**
 *
 * @param {string} expression The view-expression to validate.
 * @param {object[]} labelData Array of all label- and group-definitions.
 * @returns {CheckResult}
 */
export const checkViewExpression = (expression, labelData) => {
    const result = { valid: true, hint: '' };
    try {
        const res = tryParseViewExpression(expression, labelData);
        res.forEach((orExpr) => {
            orExpr.forEach(({ label: labelName }) => {
                if (!labelData.some(({ name }) => name === labelName)) {
                    throw new Error(`Lacking label/group definition for "${labelName}"`);
                }
            });
        });
    } catch (err) {
        result.valid = false;
        result.hint = err.message;
    }

    return result;
};

const viewUtils = {
    tryParseLabelsFromViewExpression,
    tryParseViewExpression,
    evaluateViewExpression,
    applyViewToModel,
    checkViewExpression,
};

export default viewUtils;
