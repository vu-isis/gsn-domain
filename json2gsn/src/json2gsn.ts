import { randomUUID } from 'crypto';
import { Tarjan } from 'tarjan-scc';

export interface GSNNode {
    id: string,
    type: string,
    uuid?: string,
    summary?: string,
    info?: string,
    artifacts?: string[],
    labels?: string[],
    solvedBy?: string[],
    inContextOf?: string[],
}

interface NodeData {
    name: string;
    path: string;
    uuid: string;
    index: number;
    gsnNode: GSNNode,
    children: NodeData[],
    references: {
        type: string;
        path: string;
    }[],
}

interface Namespace {
    name: string;
    type: string;
    roots: NodeData[],
    nodes: NodeData[],
}

interface GSNError {
    message: string;
    hint: string;
    index: Number;
    nodeId: string | null;
    nodeDetails: string;
}

const NAME_REGEX = /^[a-zA-Z_][0-9a-zA-Z_]*$/;
const ID_HINT = 'Each node must have a unique id field being that path to the node, e.g. "nsp/G1/G12"';
const REGEX_HINT = " must start with a letter ('a'..'z'|'A'..'Z') or underscore '_' followed by any number of letters, underscores and numbers ('0'..'9').";

function isChildPath(path: string, ownerPath: string) {
    return path.startsWith(ownerPath + '/');
}

const TYPE_TO_NAMESPACE_KEYWORD = {
    'Goal': 'GOALS',
    'Strategy': 'STRATEGIES',
    'Solution': 'SOLUTIONS',
    'Assumption': 'ASSUMPTIONS',
    'Justification': 'JUSTIFICATIONS',
    'Context': 'CONTEXTS',
};

function isValidChild(child: NodeData, parent: NodeData) {

}

export function populateNamespaces(gsnModel: GSNNode[]): { namespaces: Namespace[] | null, errors: GSNError[] | null } {
    const namespaces = new Map<string, Namespace>();
    const nodeMap = new Map<string, NodeData>();
    const errors: GSNError[] = [];
    let index = 0;

    const t = new Tarjan();

    // (1) Assign nodes to namespaces and populate nodeMap
    for (const gsnNode of gsnModel) {
        if (typeof gsnNode.id !== 'string' || !gsnNode.id) {
            errors.push({
                message: 'Node missing string id field',
                hint: ID_HINT,
                index,
                nodeId: null,
                nodeDetails: JSON.stringify(gsnNode)
            });
            continue;
        }

        const pathPieces = gsnNode.id.split('/');

        if (pathPieces.length < 2 || pathPieces.filter(pathPiece => !NAME_REGEX.test(pathPiece)).length > 0) {
            errors.push({
                message: 'Node has invalid string id field',
                hint: `${ID_HINT} and each path piece ${REGEX_HINT}`,
                index,
                nodeId: gsnNode.id,
                nodeDetails: JSON.stringify(gsnNode, null, 2)
            });
        }

        if (!TYPE_TO_NAMESPACE_KEYWORD[gsnNode.type]) {
            errors.push({
                message: `Invalid type "${gsnNode.type}"`,
                hint: `Type must be one of ${Object.keys(TYPE_TO_NAMESPACE_KEYWORD).join(', ')}`,
                index,
                nodeId: gsnNode.id,
                nodeDetails: JSON.stringify(gsnNode, null, 2)
            });
        }

        const namespaceName = pathPieces[0];
        if (!namespaces.has(namespaceName)) {
            namespaces.set(namespaceName, {
                name: namespaceName,
                type: '',
                roots: [],
                nodes: [],
            });
        }

        const namespace = namespaces.get(namespaceName);

        const nodeData: NodeData = {
            name: pathPieces[pathPieces.length - 1],
            path: gsnNode.id,
            uuid: gsnNode.uuid || randomUUID(),
            index,
            gsnNode,
            children: [],
            references: []
        }

        t.addVertex(nodeData.path);
        nodeMap.set(nodeData.path, nodeData);
        namespace.nodes.push(nodeData);

        if (pathPieces.length === 2) {
            // A root node e.g. 'nsp/G1'.
            namespace.roots.push(nodeData);
            namespace.type = nodeData.gsnNode.type;
        }

        index += 1;
    }

    if (errors.length > 0) {
        return { errors, namespaces: null };
    }


    function traverseRec(nodeData: NodeData) {
        let relations = [];
        if (nodeData.gsnNode.solvedBy) {
            relations = nodeData.gsnNode.solvedBy;
        }

        if (nodeData.gsnNode.inContextOf) {
            relations = [...relations, ...nodeData.gsnNode.inContextOf];
        }

        relations.sort();

        for (const path of relations) {
            const child = nodeMap.get(path);
            if (!child) {
                errors.push({
                    message: `Referenced node "${path}" does not exist`,
                    hint: `inContextOf and solvedBy must only contain ids of existing nodes`,
                    index,
                    nodeId: nodeData.path,
                    nodeDetails: JSON.stringify(nodeData.gsnNode, null, 2)
                });
                continue;
            }

            t.connectVertices(nodeData.path, path);
            // TODO: Check valid children.

            if (isChildPath(path, nodeData.path)) {
                nodeData.children.push(child);
                traverseRec(child);
            } else {
                nodeData.references.push({
                    type: child.gsnNode.type,
                    path: child.path,
                });
            }
        }
    }

    // (2) Build up tree-structure of nodes
    for (const namespace of namespaces.values()) {
        if (namespace.roots.length === 0) {
            errors.push({
                message: `Namespace "${namespace.name}" does not have any root-nodes`,
                hint: `All nodes need to be accounted for in the model.`,
                index: 0,
                nodeId: null,
                nodeDetails: null,
            });
        }
        for (const root of namespace.roots) {
            traverseRec(root);
        }
    }

    if (t.hasLoops()) {
        const numberOfLoops = t.calculateSCCs().filter((scc: any[]) => scc.length > 1).length;
        errors.unshift({
            message: `Model is not a DAG, it forms ${numberOfLoops} loop(s).`,
            hint: `Remove relationships to break the loops.`,
            index: -1,
            nodeId: null,
            nodeDetails: null,
        });
    }

    if (errors.length > 0) {
        return { errors, namespaces: null };
    }

    return { namespaces: [...namespaces.values()], errors: null };
}


function generateGsnText(namespace: Namespace, indent: string = '    '): string {
    const lines = [];
    let currentIndent = '';
    const increaseIndet = () => currentIndent += indent;
    const decreaseIndet = () => currentIndent = currentIndent.substring(indent.length);
    const addLine = (text: string) => lines.push(`${currentIndent}${text}`);

    function serializeNodeRec(nodeData: NodeData) {
        addLine(`${nodeData.gsnNode.type.toLowerCase()} ${nodeData.name}`);
        addLine('{');
        increaseIndet();
        addLine(`uuid:"${nodeData.uuid}";`);
        nodeData.gsnNode.summary && addLine(`summary:'''${nodeData.gsnNode.summary}''';`);
        nodeData.gsnNode.info && addLine(`info:'''${nodeData.gsnNode.info}''';`);
        nodeData.gsnNode.labels && nodeData.gsnNode.labels.forEach(label => addLine(`label:${label};`));
        nodeData.gsnNode.artifacts && nodeData.gsnNode.artifacts.forEach(artie => addLine(`artifact:"${artie}";`));
        nodeData.children.forEach(serializeNodeRec);
        nodeData.references.forEach(ref => addLine(`ref_${ref.type.toLowerCase()}: ${ref.path.replace(/\//g, '.')};`));
        decreaseIndet();
        addLine('}');
    }

    // Namespace itself
    addLine(`${TYPE_TO_NAMESPACE_KEYWORD[namespace.type]} ${namespace.name}`);
    addLine('{');
    increaseIndet();
    namespace.roots.forEach(serializeNodeRec);
    decreaseIndet();
    addLine('}\n');

    return lines.join('\n');
}


export function json2gsn(gsnModel: GSNNode[], indent: string = '    '): { contents: Map<string, string> | null, errors: GSNError[] | null } {
    const contents = new Map<string, string>();

    const { errors, namespaces } = populateNamespaces(gsnModel);

    if (errors) {
        return { contents: null, errors };
    }

    for (const namespace of namespaces) {
        contents.set(namespace.name, generateGsnText(namespace, indent));
    }

    return { contents, errors: null };
}