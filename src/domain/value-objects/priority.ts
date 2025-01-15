// src/core/domain/value-objects/priority.ts
import { RequirementPriority } from '../shared/types/enums';

export class RequirementPriorityValue {
    constructor(public readonly value: RequirementPriority) { }

    equals(other: RequirementPriorityValue): boolean {
        return this.value === other.value;
    }

    isHigherThan(other: RequirementPriorityValue): boolean {
        const priorityOrder = [
            RequirementPriority.LOW,
            RequirementPriority.MEDIUM,
            RequirementPriority.HIGH,
            RequirementPriority.CRITICAL,
        ];
        return (
            priorityOrder.indexOf(this.value) >
            priorityOrder.indexOf(other.value)
        );
    }
}
