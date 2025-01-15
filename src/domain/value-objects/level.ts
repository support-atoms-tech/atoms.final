// src/core/domain/value-objects/level.ts
import { RequirementLevel } from '../shared/types/enums';

export class RequirementLevelValue {
    constructor(public readonly value: RequirementLevel) { }

    equals(other: RequirementLevelValue): boolean {
        return this.value === other.value;
    }

    isSystemLevel(): boolean {
        return this.value === RequirementLevel.SYSTEM;
    }
}
