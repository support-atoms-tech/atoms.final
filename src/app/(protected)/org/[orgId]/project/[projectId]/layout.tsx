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
import { useParams } from 'next/navigation';

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        orgId: string;
        projectId: string;
    }>;
}

export default async function ProjectLayout({
    children,
    params,
}: ProjectLayoutProps) {
    const { orgId, projectId } = await params;

    if (!projectId) notFound();

    const queryClient = getQueryClient(); // Same instance as previous layouts

    try {
        // Fetch project data, documents, etc.
        const preferredOrgId = orgId;

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
                <div className="relative flex-1 p-16">
                    <Suspense fallback={<ProjectPageSkeleton />}>
                        {children}
                    </Suspense>
                </div>
            </ProjectProvider>
        );
    } catch (error) {
        console.error('Error in project layout:', error);
        return notFound();
    }
}
