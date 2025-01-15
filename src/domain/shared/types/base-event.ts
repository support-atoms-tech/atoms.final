// src/core/domain/events/base-event.ts

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  correlationId: string;
  causationId: string;
  metadata: {
    userId: string;
    organizationId: string;
    version: number;
  };
}
