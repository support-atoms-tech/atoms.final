import { BaseEvent } from "../shared/types/base-event";
import { UserProfileData } from "../models/user-profile";

export interface UserCreatedEvent extends BaseEvent {
    type: 'USER_CREATED';
    payload: {
        userId: string;
    };
}

export interface UserUpdatedEvent extends BaseEvent {
    type: 'USER_UPDATED';
    payload: {
        userId: string;
        changes: Partial<UserProfileData>;
    };
}

export interface UserDeletedEvent extends BaseEvent {
    type: 'USER_DELETED';
    payload: {
        userId: string;
    };
}

export type UserEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent;   