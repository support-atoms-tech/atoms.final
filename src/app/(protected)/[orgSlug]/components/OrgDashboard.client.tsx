'use client';

import DashboardView, { Column, SupportedDataTypes } from "@/components/base/DashboardView";
import { Organization, Project } from "@/types";
import { useProjectsByMembershipForOrg } from "@/hooks/queries/useProject";
import { useRouter } from "next/navigation";
import { useContextStore } from "@/store/context.store";

export default function OrgDashboard({ orgId, userId }: { orgId: string, userId: string }) {
    const router = useRouter();
    const { setCurrentProjectId } = useContextStore();
    const { data: projects, isLoading } = useProjectsByMembershipForOrg(orgId, userId);

    const columns: Column[] = [
        {
            header: "Name",
            accessor: ((item: SupportedDataTypes) => (item as Project).name),
        },
        {
            header: "Status",
            accessor: ((item: SupportedDataTypes) => (item as Project).status || "N/A"),
        },
    ];

    const handleRowClick = (item: SupportedDataTypes) => {
        setCurrentProjectId((item as Project).id);
        router.push(`/${(item as Project).slug}`);
    };

    return (
        <DashboardView
            data={projects || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No projects found."
            onRowClick={handleRowClick}
        />
    );
}