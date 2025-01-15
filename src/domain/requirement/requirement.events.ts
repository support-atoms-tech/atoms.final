// src/core/domain/events/requirement-events.ts
import { RequirementData } from './requirement.types';
import { BaseEvent } from '../shared/types/base-event';

export interface RequirementCreatedEvent extends BaseEvent {
    type: 'REQUIREMENT_CREATED';
    payload: {
        requirementId: string;
        projectId: string;
        title: string;
        createdBy: string;
    };
}

export interface RequirementUpdatedEvent extends BaseEvent {
    type: 'REQUIREMENT_UPDATED';
    payload: {
        requirementId: string;
        changes: Partial<RequirementData>;
        previousVersion: number;
    };
}


export interface RequirementDeletedEvent extends BaseEvent {
    type: 'REQUIREMENT_DELETED';
    payload: {
        requirementId: string;
    };
}

export type RequirementEvent = RequirementCreatedEvent | RequirementUpdatedEvent | RequirementDeletedEvent;