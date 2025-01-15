import { OrganizationData } from "./organization.types";
import { BaseEvent } from "../shared/types/base-event";

export interface OrganizationCreatedEvent extends BaseEvent {
    type: 'ORGANIZATION_CREATED';
    payload: {
        organizationId: string;
    };
}

export interface OrganizationUpdatedEvent extends BaseEvent {
    type: 'ORGANIZATION_UPDATED';
    payload: {
        organizationId: string;
        changes: Partial<OrganizationData>;
    };
}

export interface OrganizationDeletedEvent extends BaseEvent {
    type: 'ORGANIZATION_DELETED';
    payload: {
        organizationId: string;
    };
}

export type OrganizationEvent = OrganizationCreatedEvent | OrganizationUpdatedEvent;