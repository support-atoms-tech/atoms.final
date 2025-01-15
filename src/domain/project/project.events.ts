import { ProjectData } from "./project.types";
import { BaseEvent } from "../shared/types/base-event";

export interface ProjectCreatedEvent extends BaseEvent {
    type: 'PROJECT_CREATED';
    payload: {
        projectId: string;
    };
}

export interface ProjectUpdatedEvent extends BaseEvent {
    type: 'PROJECT_UPDATED';
    payload: {
        projectId: string;
        changes: Partial<ProjectData>;
    };
}

export interface ProjectDeletedEvent extends BaseEvent {
    type: 'PROJECT_DELETED';
    payload: {
        projectId: string;
    };
}

export type ProjectEvent = ProjectCreatedEvent | ProjectUpdatedEvent | ProjectDeletedEvent;