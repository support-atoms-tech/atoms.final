import { TableDataAdapter } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';

export function createRequirementsAdapter(opts: {
    saveRequirement: (
        item: DynamicRequirement,
        isNew: boolean,
        userId: string,
        userName: string,
        skipRefresh?: boolean,
    ) => Promise<unknown>;
    deleteRequirement: (item: DynamicRequirement, userId: string) => Promise<void>;
    refreshRequirements: () => Promise<void>;
    userId: string;
    userName: string;
}): TableDataAdapter<DynamicRequirement> {
    const {
        saveRequirement,
        deleteRequirement,
        refreshRequirements: _refreshRequirements, // kept for API compatibility
        userId,
        userName,
    } = opts;

    return {
        async saveRow(
            item,
            isNew,
            context?: { blockId?: string; skipRefresh?: boolean },
        ) {
            const skipRefresh = context?.skipRefresh ?? false;
            await saveRequirement(item, isNew, userId, userName, skipRefresh);
        },
        async deleteRow(item) {
            await deleteRequirement(item, userId);
        },
        async postSaveRefresh() {
            // Skip refresh - realtime subscriptions already handle requirement updates
            // Calling refreshRequirements here causes duplicate fetches and data sync spam
            // The realtime subscription in useDocumentRealtime will update the blocks state,
            // which flows to GlideEditableTable automatically
            // await refreshRequirements();
        },
    };
}
