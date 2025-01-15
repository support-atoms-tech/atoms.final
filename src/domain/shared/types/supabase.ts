export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            collections: {
                Row: {
                    access_level: Database['public']['Enums']['access_level'];
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    name: string;
                    organization_id: string | null;
                    tags: string[] | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                };
                Insert: {
                    access_level?: Database['public']['Enums']['access_level'];
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name: string;
                    organization_id?: string | null;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Update: {
                    access_level?: Database['public']['Enums']['access_level'];
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name?: string;
                    organization_id?: string | null;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'collections_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            component_property_schemas: {
                Row: {
                    component_id: string;
                    created_at: string | null;
                    created_by: string | null;
                    default_value: Json | null;
                    description: string | null;
                    display_name: string;
                    id: string;
                    is_deleted: boolean | null;
                    key: string;
                    metadata: Json | null;
                    options: Json | null;
                    type: Database['public']['Enums']['property_type'];
                    updated_at: string | null;
                    updated_by: string | null;
                    validation_rules: Json | null;
                    version: number | null;
                };
                Insert: {
                    component_id: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    default_value?: Json | null;
                    description?: string | null;
                    display_name: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    key: string;
                    metadata?: Json | null;
                    options?: Json | null;
                    type: Database['public']['Enums']['property_type'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    validation_rules?: Json | null;
                    version?: number | null;
                };
                Update: {
                    component_id?: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    default_value?: Json | null;
                    description?: string | null;
                    display_name?: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    key?: string;
                    metadata?: Json | null;
                    options?: Json | null;
                    type?: Database['public']['Enums']['property_type'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    validation_rules?: Json | null;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'component_property_schemas_component_id_fkey';
                        columns: ['component_id'];
                        isOneToOne: false;
                        referencedRelation: 'components';
                        referencedColumns: ['id'];
                    },
                ];
            };
            components: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    default_property_values: Json | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    name: string;
                    status: Database['public']['Enums']['entity_status'];
                    tags: string[] | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    default_property_values?: Json | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name: string;
                    status?: Database['public']['Enums']['entity_status'];
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    default_property_values?: Json | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name?: string;
                    status?: Database['public']['Enums']['entity_status'];
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Relationships: [];
            };
            entity_assignments: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    entity_id: string;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    priority:
                    | Database['public']['Enums']['requirement_priority']
                    | null;
                    role: Database['public']['Enums']['assignment_role'];
                    updated_at: string | null;
                    updated_by: string | null;
                    user_id: string;
                    version: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    entity_id: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    priority?:
                    | Database['public']['Enums']['requirement_priority']
                    | null;
                    role: Database['public']['Enums']['assignment_role'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    user_id: string;
                    version?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    entity_id?: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    priority?:
                    | Database['public']['Enums']['requirement_priority']
                    | null;
                    role?: Database['public']['Enums']['assignment_role'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    user_id?: string;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'entity_assignments_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'user_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            entity_members: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    entity_id: string;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    role: Database['public']['Enums']['member_role'];
                    updated_at: string | null;
                    updated_by: string | null;
                    user_id: string;
                    version: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    entity_id: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    role?: Database['public']['Enums']['member_role'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    user_id: string;
                    version?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    entity_id?: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    role?: Database['public']['Enums']['member_role'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    user_id?: string;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'entity_members_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'user_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            organizations: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    logo_url: string | null;
                    metadata: Json | null;
                    name: string;
                    tags: string[] | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                    website: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    logo_url?: string | null;
                    metadata?: Json | null;
                    name: string;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                    website?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    logo_url?: string | null;
                    metadata?: Json | null;
                    name?: string;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                    website?: string | null;
                };
                Relationships: [];
            };
            project_components: {
                Row: {
                    component_id: string;
                    created_at: string | null;
                    created_by: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    order: number;
                    project_id: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                };
                Insert: {
                    component_id: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    order?: number;
                    project_id: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Update: {
                    component_id?: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    order?: number;
                    project_id?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'project_components_component_id_fkey';
                        columns: ['component_id'];
                        isOneToOne: false;
                        referencedRelation: 'components';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'project_components_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            projects: {
                Row: {
                    access_level: Database['public']['Enums']['access_level'];
                    actual_end_date: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    name: string;
                    organization_id: string | null;
                    project_owner_id: string;
                    start_date: string | null;
                    status: Database['public']['Enums']['entity_status'];
                    tags: string[] | null;
                    target_end_date: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                };
                Insert: {
                    access_level?: Database['public']['Enums']['access_level'];
                    actual_end_date?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name: string;
                    organization_id?: string | null;
                    project_owner_id: string;
                    start_date?: string | null;
                    status?: Database['public']['Enums']['entity_status'];
                    tags?: string[] | null;
                    target_end_date?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Update: {
                    access_level?: Database['public']['Enums']['access_level'];
                    actual_end_date?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name?: string;
                    organization_id?: string | null;
                    project_owner_id?: string;
                    start_date?: string | null;
                    status?: Database['public']['Enums']['entity_status'];
                    tags?: string[] | null;
                    target_end_date?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'projects_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'projects_project_owner_id_fkey';
                        columns: ['project_owner_id'];
                        isOneToOne: false;
                        referencedRelation: 'user_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            requirement_property_values: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    is_valid: boolean;
                    last_validated: string | null;
                    metadata: Json | null;
                    requirement_id: string;
                    schema_id: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    value: Json;
                    version: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    is_valid?: boolean;
                    last_validated?: string | null;
                    metadata?: Json | null;
                    requirement_id: string;
                    schema_id: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    value: Json;
                    version?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    is_valid?: boolean;
                    last_validated?: string | null;
                    metadata?: Json | null;
                    requirement_id?: string;
                    schema_id?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    value?: Json;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'requirement_property_values_requirement_id_fkey';
                        columns: ['requirement_id'];
                        isOneToOne: false;
                        referencedRelation: 'requirements';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'requirement_property_values_schema_id_fkey';
                        columns: ['schema_id'];
                        isOneToOne: false;
                        referencedRelation: 'component_property_schemas';
                        referencedColumns: ['id'];
                    },
                ];
            };
            requirement_versions: {
                Row: {
                    change_reason: string | null;
                    changed_by: string | null;
                    content: Json;
                    created_at: string | null;
                    id: string;
                    requirement_id: string;
                    updated_at: string | null;
                    version: number;
                };
                Insert: {
                    change_reason?: string | null;
                    changed_by?: string | null;
                    content: Json;
                    created_at?: string | null;
                    id?: string;
                    requirement_id: string;
                    updated_at?: string | null;
                    version: number;
                };
                Update: {
                    change_reason?: string | null;
                    changed_by?: string | null;
                    content?: Json;
                    created_at?: string | null;
                    id?: string;
                    requirement_id?: string;
                    updated_at?: string | null;
                    version?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'requirement_versions_changed_by_fkey';
                        columns: ['changed_by'];
                        isOneToOne: false;
                        referencedRelation: 'user_profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'requirement_versions_requirement_id_fkey';
                        columns: ['requirement_id'];
                        isOneToOne: false;
                        referencedRelation: 'requirements';
                        referencedColumns: ['id'];
                    },
                ];
            };
            requirements: {
                Row: {
                    component_id: string;
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    enhanced_content: Json | null;
                    id: string;
                    is_deleted: boolean | null;
                    level: Database['public']['Enums']['requirement_level'];
                    metadata: Json | null;
                    original_content: string;
                    priority: Database['public']['Enums']['requirement_priority'];
                    selected_format:
                    | Database['public']['Enums']['requirement_format']
                    | null;
                    status: Database['public']['Enums']['requirement_status'];
                    tags: string[] | null;
                    title: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                };
                Insert: {
                    component_id: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    enhanced_content?: Json | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    level?: Database['public']['Enums']['requirement_level'];
                    metadata?: Json | null;
                    original_content: string;
                    priority?: Database['public']['Enums']['requirement_priority'];
                    selected_format?:
                    | Database['public']['Enums']['requirement_format']
                    | null;
                    status?: Database['public']['Enums']['requirement_status'];
                    tags?: string[] | null;
                    title?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Update: {
                    component_id?: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    enhanced_content?: Json | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    level?: Database['public']['Enums']['requirement_level'];
                    metadata?: Json | null;
                    original_content?: string;
                    priority?: Database['public']['Enums']['requirement_priority'];
                    selected_format?:
                    | Database['public']['Enums']['requirement_format']
                    | null;
                    status?: Database['public']['Enums']['requirement_status'];
                    tags?: string[] | null;
                    title?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'requirements_component_id_fkey';
                        columns: ['component_id'];
                        isOneToOne: false;
                        referencedRelation: 'components';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_profiles: {
                Row: {
                    avatar_url: string | null;
                    bio: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    department: string | null;
                    display_name: string | null;
                    firebase_uid: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    job_title: string | null;
                    metadata: Json | null;
                    organization_id: string | null;
                    tags: string[] | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number | null;
                };
                Insert: {
                    avatar_url?: string | null;
                    bio?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    department?: string | null;
                    display_name?: string | null;
                    firebase_uid?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    job_title?: string | null;
                    metadata?: Json | null;
                    organization_id?: string | null;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Update: {
                    avatar_url?: string | null;
                    bio?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    department?: string | null;
                    display_name?: string | null;
                    firebase_uid?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    job_title?: string | null;
                    metadata?: Json | null;
                    organization_id?: string | null;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_profiles_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            gtrgm_compress: {
                Args: {
                    '': unknown;
                };
                Returns: unknown;
            };
            gtrgm_decompress: {
                Args: {
                    '': unknown;
                };
                Returns: unknown;
            };
            gtrgm_in: {
                Args: {
                    '': unknown;
                };
                Returns: unknown;
            };
            gtrgm_options: {
                Args: {
                    '': unknown;
                };
                Returns: undefined;
            };
            gtrgm_out: {
                Args: {
                    '': unknown;
                };
                Returns: unknown;
            };
            set_limit: {
                Args: {
                    '': number;
                };
                Returns: number;
            };
            show_limit: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
            show_trgm: {
                Args: {
                    '': string;
                };
                Returns: string[];
            };
        };
        Enums: {
            access_level: 'private' | 'project' | 'organization' | 'public';
            assignment_role: 'assignee' | 'reviewer' | 'observer';
            document_type:
            | 'specification'
            | 'reference'
            | 'documentation'
            | 'standard'
            | 'guideline'
            | 'report';
            entity_status:
            | 'draft'
            | 'active'
            | 'on_hold'
            | 'completed'
            | 'archived';
            member_role: 'owner' | 'manager' | 'contributor' | 'viewer';
            notification_preference: 'all' | 'important' | 'none';
            property_type:
            | 'text'
            | 'number'
            | 'boolean'
            | 'date'
            | 'enum'
            | 'multi_enum'
            | 'rich_text'
            | 'url'
            | 'user_reference'
            | 'requirement_reference'
            | 'component_reference';
            requirement_format: 'ears' | 'incose';
            requirement_level: 'system' | 'sub_system' | 'component';
            requirement_priority: 'critical' | 'high' | 'medium' | 'low';
            requirement_status:
            | 'draft'
            | 'pending_review'
            | 'approved'
            | 'in_progress'
            | 'testing'
            | 'completed'
            | 'rejected';
            trace_link_type:
            | 'derives_from'
            | 'implements'
            | 'relates_to'
            | 'conflicts_with'
            | 'is_related_to'
            | 'parent_of'
            | 'child_of';
            user_theme: 'light' | 'dark' | 'system';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R;
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
            Row: infer R;
        }
    ? R
    : never
    : never;

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I;
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
    }
    ? I
    : never
    : never;

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U;
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
    }
    ? U
    : never
    : never;

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database;
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
