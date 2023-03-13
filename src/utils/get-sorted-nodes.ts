import { addComments, removeComments } from '@babel/types';
import { clone, isEqual, zip } from 'lodash';

import { THIRD_PARTY_MODULES_SPECIAL_WORD, newLineNode } from '../constants';
import { naturalSort } from '../natural-sort';
import { GetSortedNodes, ImportGroups, ImportOrLine } from '../types';
import { getImportNodesMatchedGroup } from './get-import-nodes-matched-group';
import { getSortedImportSpecifiers } from './get-sorted-import-specifiers';
import { getSortedNodesGroup } from './get-sorted-nodes-group';

/**
 * This function returns all the nodes which are in the importOrder array.
 * The plugin considered these import nodes as local import declarations.
 * @param nodes all import nodes
 * @param options
 */
export const getSortedNodes: GetSortedNodes = (nodes, options) => {
    naturalSort.insensitive = options.importOrderCaseInsensitive;

    let { importOrder, importOrderSeparationGroups } = options;
    const {
        importOrderSeparation,
        importOrderSortSpecifiers,
        importOrderGroupNamespaceSpecifiers,
    } = options;

    const originalNodes = nodes.map(clone);
    const finalNodes: ImportOrLine[] = [];

    if (importOrderSeparationGroups.length === 0) {
        importOrderSeparationGroups = [...importOrder];
    }

    if (!importOrder.includes(THIRD_PARTY_MODULES_SPECIAL_WORD)) {
        importOrder = [THIRD_PARTY_MODULES_SPECIAL_WORD, ...importOrder];
        importOrderSeparationGroups = [
            THIRD_PARTY_MODULES_SPECIAL_WORD,
            ...importOrderSeparationGroups,
        ];
    }

    const importOrderGroups = importOrder.reduce<ImportGroups>(
        (groups, regexp) => ({
            ...groups,
            [regexp]: [],
        }),
        {},
    );

    for (const node of originalNodes) {
        const matchedGroup = getImportNodesMatchedGroup(node, importOrder);
        importOrderGroups[matchedGroup].push(node);
    }

    let latestMatchedGroup = '';

    for (const [group, thisGroupName] of zip(
        importOrder,
        importOrderSeparationGroups,
    )) {
        if (!group) continue;
        const groupNodes = importOrderGroups[group];

        if (groupNodes.length === 0) continue;

        if (latestMatchedGroup === '') {
            latestMatchedGroup = thisGroupName as string;
        }

        const sortedInsideGroup = getSortedNodesGroup(groupNodes, {
            importOrderGroupNamespaceSpecifiers,
        });

        // Sort the import specifiers
        if (importOrderSortSpecifiers) {
            sortedInsideGroup.forEach((node) =>
                getSortedImportSpecifiers(node),
            );
        }

        if (importOrderSeparation && latestMatchedGroup !== thisGroupName) {
            latestMatchedGroup = thisGroupName as string;
            finalNodes.push(newLineNode);
        }

        finalNodes.push(...sortedInsideGroup);
    }

    if (finalNodes.length > 0) {
        // a newline after all imports
        finalNodes.push(newLineNode);
    }

    // maintain a copy of the nodes to extract comments from
    const finalNodesClone = finalNodes.map(clone);

    const firstNodesComments = nodes[0].leadingComments;

    // Remove all comments from sorted nodes
    finalNodes.forEach(removeComments);

    // insert comments other than the first comments
    finalNodes.forEach((node, index) => {
        if (isEqual(nodes[0].loc, node.loc)) return;

        addComments(
            node,
            'leading',
            finalNodesClone[index].leadingComments || [],
        );
    });

    if (firstNodesComments) {
        addComments(finalNodes[0], 'leading', firstNodesComments);
    }

    return finalNodes;
};
