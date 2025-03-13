import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

import { Json } from '@/types/base/database.types';
import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';

// Default property keys enum for use in block creation
export enum DefaultPropertyKeys {
    NAME = 'name',
    DESCRIPTION = 'description',
    STATUS = 'status',
    PRIORITY = 'priority',
    ID = 'id'
}

export interface BlockContent {
    position?: number;
    text?: string;
    format?: string;
    image?: string;
    requirements?: Requirement[];
}

export interface BlockCanvasProps {
    documentId: string;
}

export interface BlockWithRequirements extends Block {
    requirements: Requirement[];
    order: number;
    org_id?: string;
    project_id?: string;
    height?: number;
}

export enum BlockType {
    text = 'text',
    table = 'table'
}

export interface BlockProps {
    block: BlockWithRequirements;
    onUpdate: (content: Json) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    isEditMode?: boolean;
    onDelete?: () => void;
    onDoubleClick?: () => void;
    properties?: Property[];
}

export interface BlockActionsProps {
    onDelete: () => void;
    isEditMode: boolean;
    dragActivators?: SyntheticListenerMap;
}

export interface UseBlockActionsProps {
    documentId: string;
    userProfile: Profile | null;
    blocks: BlockWithRequirements[] | undefined;
    setLocalBlocks: React.Dispatch<
        React.SetStateAction<BlockWithRequirements[]>
    >;
    orgId: string;
    projectId: string;
}

// New Property interface based on the provided table schema
export interface Property {
    id: string;
    org_id: string;
    project_id: string;
    document_id: string;
    block_id?: string;
    name: string;
    key: string;
    type: PropertyType;
    description?: string;
    options?: Json;
    default_value?: Json;
    position: number;
    is_required: boolean;
    is_hidden: boolean;
    created_at?: string;
    updated_at?: string;
    created_by: string;
    updated_by: string;
    is_deleted: boolean;
    deleted_by?: string;
    deleted_at?: string;
    is_schema: boolean;
}

// Enum for property types
export type PropertyType = 
    | 'text' 
    | 'number' 
    | 'boolean'
    | 'date'
    | 'select'
    | 'multi_select'
    | 'user'
    | 'url'
    | 'email'
    | 'rich_text';
