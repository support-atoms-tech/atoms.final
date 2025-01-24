'use client';

import DashboardView, { Column, SupportedDataTypes } from "@/components/base/DashboardView";
import { Organization } from "@/types";
import { useOrganizationsByMembership } from "@/hooks/queries/useOrganization";
import { useRouter } from "next/navigation";
import { useContextStore } from "@/store/context.store";

export default function HomeDashboard({ userId }: { userId: string }) {
    const router = useRouter();
    const { setCurrentUserId, setCurrentOrgId } = useContextStore();
    const { data: organizations, isLoading } = useOrganizationsByMembership(userId);

    //setCurrentUserId(userId);

    const columns: Column[] = [
        {
            header: "Name",
            accessor: ((item: SupportedDataTypes) => (item as Organization).name),
        },
        {
            header: "Type",
            accessor: ((item: SupportedDataTypes) => (item as Organization).type),
        },
        {
            header: "Status",
            accessor: ((item: SupportedDataTypes) => (item as Organization).status || "N/A"),
        },
        {
            header: "Members",
            accessor: ((item: SupportedDataTypes) => (item as Organization).member_count?.toString() || "0"),
        },
    ];

    const handleRowClick = (item: SupportedDataTypes) => {
        setCurrentUserId(userId);
        setCurrentOrgId((item as Organization).id);
        router.push(`/${(item as Organization).slug}`);
    };

    return (
        <DashboardView
            data={organizations || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No organizations found."
            onRowClick={handleRowClick}
        />
    );
}