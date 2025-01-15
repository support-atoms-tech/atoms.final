// src/core/domain/value-objects/status.ts
import {
    ProjectStatus,
    ComponentStatus,
    RequirementStatus,
} from '../shared/types/enums';

export class ProjectStatusValue {
    constructor(public readonly value: ProjectStatus) { }

    equals(other: ProjectStatusValue): boolean {
        return this.value === other.value;
    }

    isActive(): boolean {
        return this.value === ProjectStatus.ACTIVE;
    }

    isCompleted(): boolean {
        return this.value === ProjectStatus.COMPLETED;
    }
}

export class ComponentStatusValue {
    constructor(public readonly value: ComponentStatus) { }

    equals(other: ComponentStatusValue): boolean {
        return this.value === other.value;
    }

    isActive(): boolean {
        return this.value === ComponentStatus.ACTIVE;
    }
}

export class RequirementStatusValue {
    constructor(public readonly value: RequirementStatus) { }

    equals(other: RequirementStatusValue): boolean {
        return this.value === other.value;
    }

    isActive(): boolean {
        return this.value === RequirementStatus.IN_PROGRESS;
    }
}
