'use client';

import DashboardView from "@/components/base/DashboardView";
import { Organization } from "@/types";
import { useOrganizationsByMembership } from "@/hooks/queries/useOrganization";

export default function HomeDashboard({ userId }: { userId: string }) {
    const { data: organizations, isLoading } = useOrganizationsByMembership(userId);
    const organizationsData = organizations || [];
    console.log(organizationsData);
    return <DashboardView data={organizationsData} columns={[]} />;
}