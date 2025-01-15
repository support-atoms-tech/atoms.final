import { ComponentData } from "./component.types";
import { BaseEvent } from "../shared/types/base-event";

export interface ComponentCreatedEvent extends BaseEvent {
    type: 'COMPONENT_CREATED';
    payload: {
        componentId: string;
    };
}

export interface ComponentUpdatedEvent extends BaseEvent {
    type: 'COMPONENT_UPDATED';
    payload: {
        componentId: string;
        changes: Partial<ComponentData>;
    };
}

export interface ComponentDeletedEvent extends BaseEvent {
    type: 'COMPONENT_DELETED';
    payload: {
        componentId: string;
    };
}

export type ComponentEvent = ComponentCreatedEvent | ComponentUpdatedEvent | ComponentDeletedEvent;