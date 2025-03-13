// src/app/(protected)/org/project/[projectId]/layout.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getCookie } from '@/app/(protected)/org/actions';
import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { ProjectPageSkeleton } from '@/components/custom/skeletons/ProjectPageSkeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getQueryClient } from '@/lib/constants/queryClient';
import { fetchProjectData } from '@/lib/db/utils/prefetchData';
import { ProjectProvider } from '@/lib/providers/project.provider';
import { Project } from '@/types';
import { Document } from '@/types/base/documents.types';

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ProjectLayout({
    children,
    params,
}: ProjectLayoutProps) {
    const { projectId } = await params;

    if (!projectId) notFound();

    const queryClient = getQueryClient(); // Same instance as previous layouts

    try {
        // Fetch project data, documents, etc.
        const preferredOrgId = (await getCookie('preferred_org_id'))?.value;
        if (!preferredOrgId) notFound();

        const { project, documents } = await fetchProjectData(
            preferredOrgId,
            projectId,
            queryClient,
        );

        if (!project) notFound();

        return (
            <ProjectProvider
                initialProject={project as Project}
                initialDocuments={documents as Document[]}
            >
                <SidebarProvider>
                    <Sidebar />
                    <div className="relative flex-1 p-16">
                        <Suspense fallback={<ProjectPageSkeleton />}>
                            {children}
                        </Suspense>
                    </div>
                    <VerticalToolbar />
                </SidebarProvider>
            </ProjectProvider>
        );
    } catch (error) {
        console.error('Error in project layout:', error);
        return notFound();
    }
}
