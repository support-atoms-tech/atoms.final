import { CollectionData } from "./collection.types";
import { BaseEvent } from "../shared/types/base-event";

export interface CollectionCreatedEvent extends BaseEvent {
    type: 'COLLECTION_CREATED';
    payload: {
        collectionId: string;
    };
}

export interface CollectionUpdatedEvent extends BaseEvent {
    type: 'COLLECTION_UPDATED';
    payload: {
        collectionId: string;
        changes: Partial<CollectionData>;
    };
}

export interface CollectionDeletedEvent extends BaseEvent {
    type: 'COLLECTION_DELETED';
    payload: {
        collectionId: string;
    };
}

export type CollectionEvent = CollectionCreatedEvent | CollectionUpdatedEvent | CollectionDeletedEvent;