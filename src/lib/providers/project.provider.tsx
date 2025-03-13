'use client';

import { createContext, useContext, useState } from 'react';

import { Document } from '@/types/base/documents.types';
import { Project } from '@/types/base/projects.types';

interface ProjectContextType {
    project: Project | null;
    setProject: (project: Project | null) => void;
    documents: Document[] | null;
    setDocuments: (documents: Document[] | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({
    children,
    initialProject,
    initialDocuments,
}: {
    children: React.ReactNode;
    initialProject: Project | null;
    initialDocuments: Document[] | null;
}) => {
    const [project, setProject] = useState<Project | null>(initialProject);
    const [documents, setDocuments] = useState<Document[] | null>(
        initialDocuments,
    );
    return (
        <ProjectContext.Provider
            value={{ project, setProject, documents, setDocuments }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
