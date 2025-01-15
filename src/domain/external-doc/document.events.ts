import { ExternalDocData } from "./document.types";
import { BaseEvent } from "../shared/types/base-event";

export interface DocumentCreatedEvent extends BaseEvent {
    type: 'DOCUMENT_CREATED';
    payload: {
        documentId: string;
    };
}

export interface DocumentUpdatedEvent extends BaseEvent {
    type: 'DOCUMENT_UPDATED';
    payload: {
        documentId: string;
        changes: Partial<ExternalDocData>;
    };
}

export interface DocumentDeletedEvent extends BaseEvent {
    type: 'DOCUMENT_DELETED';
    payload: {
        documentId: string;
    };
}

export type DocumentEvent = DocumentCreatedEvent | DocumentUpdatedEvent | DocumentDeletedEvent;