export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            articles: {
                Row: {
                    author_id: string
                    category: Database["public"]["Enums"]["article_category"]
                    content: Json | null
                    content_en: string | null
                    content_pl: string
                    content_ru: string
                    content_uk: string
                    created_at: string
                    id: string
                    main_image_url: string | null
                    preview: string | null
                    preview_en: string | null
                    preview_pl: string
                    preview_ru: string
                    preview_uk: string
                    seo_description_en: string | null
                    seo_description_pl: string | null
                    seo_description_ru: string | null
                    seo_description_uk: string | null
                    seo_title_en: string | null
                    seo_title_pl: string | null
                    seo_title_ru: string | null
                    seo_title_uk: string | null
                    status: Database["public"]["Enums"]["article_status"]
                    title: string | null
                    title_en: string | null
                    title_pl: string
                    title_ru: string
                    title_uk: string
                    updated_at: string
                    views_count: number
                }
                Insert: {
                    author_id: string
                    category: Database["public"]["Enums"]["article_category"]
                    content?: Json | null
                    content_en?: string | null
                    content_pl: string
                    content_ru: string
                    content_uk: string
                    created_at?: string
                    id?: string
                    main_image_url?: string | null
                    preview?: string | null
                    preview_en?: string | null
                    preview_pl: string
                    preview_ru: string
                    preview_uk: string
                    seo_description_en?: string | null
                    seo_description_pl?: string | null
                    seo_description_ru?: string | null
                    seo_description_uk?: string | null
                    seo_title_en?: string | null
                    seo_title_pl?: string | null
                    seo_title_ru?: string | null
                    seo_title_uk?: string | null
                    status?: Database["public"]["Enums"]["article_status"]
                    title?: string | null
                    title_en?: string | null
                    title_pl: string
                    title_ru: string
                    title_uk: string
                    updated_at?: string
                    views_count?: number
                }
                Update: {
                    author_id?: string
                    category?: Database["public"]["Enums"]["article_category"]
                    content?: Json | null
                    content_en?: string | null
                    content_pl?: string
                    content_ru?: string
                    content_uk?: string
                    created_at?: string
                    id?: string
                    main_image_url?: string | null
                    preview?: string | null
                    preview_en?: string | null
                    preview_pl?: string
                    preview_ru?: string
                    preview_uk?: string
                    seo_description_en?: string | null
                    seo_description_pl?: string | null
                    seo_description_ru?: string | null
                    seo_description_uk?: string | null
                    seo_title_en?: string | null
                    seo_title_pl?: string | null
                    seo_title_ru?: string | null
                    seo_title_uk?: string | null
                    status?: Database["public"]["Enums"]["article_status"]
                    title?: string | null
                    title_en?: string | null
                    title_pl?: string
                    title_ru?: string
                    title_uk?: string
                    updated_at?: string
                    views_count?: number
                }
                Relationships: []
            }
            event_registrations: {
                Row: {
                    created_at: string
                    event_id: string
                    id: string
                    registration_data: Json | null
                    status: Database["public"]["Enums"]["registration_status"] | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    event_id: string
                    id?: string
                    registration_data?: Json | null
                    status?: Database["public"]["Enums"]["registration_status"] | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    event_id?: string
                    id?: string
                    registration_data?: Json | null
                    status?: Database["public"]["Enums"]["registration_status"] | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            events: {
                Row: {
                    cover_url: string | null
                    created_at: string
                    created_by: string
                    description_en: string | null
                    description_pl: string
                    description_ru: string
                    description_uk: string
                    event_date: string
                    id: string
                    limit_mode: string | null
                    location_en: string | null
                    location_pl: string
                    location_ru: string
                    location_uk: string
                    main_image_url: string | null
                    map_url: string | null
                    max_participants: number | null
                    max_players: number | null
                    min_players: number | null
                    price: number | null
                    price_amount: number | null
                    price_currency: string | null
                    registration_deadline: string | null
                    rules_en: string | null
                    rules_pl: string | null
                    rules_ru: string | null
                    rules_uk: string | null
                    scenario_en: string | null
                    scenario_pl: string | null
                    scenario_ru: string | null
                    scenario_uk: string | null
                    start_datetime: string | null
                    status: Database["public"]["Enums"]["event_status"]
                    status_registration: string | null
                    title_en: string | null
                    title_pl: string
                    title_ru: string
                    title_uk: string
                    updated_at: string
                }
                Insert: {
                    cover_url?: string | null
                    created_at?: string
                    created_by: string
                    description_en?: string | null
                    description_pl: string
                    description_ru: string
                    description_uk: string
                    event_date: string
                    id?: string
                    limit_mode?: string | null
                    location_en?: string | null
                    location_pl: string
                    location_ru: string
                    location_uk: string
                    main_image_url?: string | null
                    map_url?: string | null
                    max_participants?: number | null
                    max_players?: number | null
                    min_players?: number | null
                    price?: number | null
                    price_amount?: number | null
                    price_currency?: string | null
                    registration_deadline?: string | null
                    rules_en?: string | null
                    rules_pl?: string | null
                    rules_ru?: string | null
                    rules_uk?: string | null
                    scenario_en?: string | null
                    scenario_pl?: string | null
                    scenario_ru?: string | null
                    scenario_uk?: string | null
                    start_datetime?: string | null
                    status?: Database["public"]["Enums"]["event_status"]
                    status_registration?: string | null
                    title_en?: string | null
                    title_pl: string
                    title_ru: string
                    title_uk: string
                    updated_at?: string
                }
                Update: {
                    cover_url?: string | null
                    created_at?: string
                    created_by?: string
                    description_en?: string | null
                    description_pl?: string
                    description_ru?: string
                    description_uk?: string
                    event_date?: string
                    id?: string
                    limit_mode?: string | null
                    location_en?: string | null
                    location_pl?: string
                    location_ru?: string
                    location_uk?: string
                    main_image_url?: string | null
                    map_url?: string | null
                    max_participants?: number | null
                    max_players?: number | null
                    min_players?: number | null
                    price?: number | null
                    price_amount?: number | null
                    price_currency?: string | null
                    registration_deadline?: string | null
                    rules_en?: string | null
                    rules_pl?: string | null
                    rules_ru?: string | null
                    rules_uk?: string | null
                    scenario_en?: string | null
                    scenario_pl?: string | null
                    scenario_ru?: string | null
                    scenario_uk?: string | null
                    start_datetime?: string | null
                    status?: Database["public"]["Enums"]["event_status"]
                    status_registration?: string | null
                    title_en?: string | null
                    title_pl?: string
                    title_ru?: string
                    title_uk?: string
                    updated_at?: string
                }
                Relationships: []
            }
            gallery_items: {
                Row: {
                    created_at: string
                    description_en: string | null
                    description_pl: string | null
                    description_ru: string | null
                    description_uk: string | null
                    display_order: number | null
                    file_type: string
                    file_url: string
                    id: string
                    status: string | null
                    thumbnail_url: string | null
                    title_en: string | null
                    title_pl: string | null
                    title_ru: string | null
                    title_uk: string | null
                    updated_at: string
                    uploaded_by: string
                }
                Insert: {
                    created_at?: string
                    description_en?: string | null
                    description_pl?: string | null
                    description_ru?: string | null
                    description_uk?: string | null
                    display_order?: number | null
                    file_type: string
                    file_url: string
                    id?: string
                    status?: string | null
                    thumbnail_url?: string | null
                    title_en?: string | null
                    title_pl?: string | null
                    title_ru?: string | null
                    title_uk?: string | null
                    updated_at?: string
                    uploaded_by: string
                }
                Update: {
                    created_at?: string
                    description_en?: string | null
                    description_pl?: string | null
                    description_ru?: string | null
                    description_uk?: string | null
                    display_order?: number | null
                    file_type?: string
                    file_url?: string
                    id?: string
                    status?: string | null
                    thumbnail_url?: string | null
                    title_en?: string | null
                    title_pl?: string | null
                    title_ru?: string | null
                    title_uk?: string | null
                    updated_at?: string
                    uploaded_by?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    created_at: string
                    display_name: string | null
                    id: string
                    notifications_enabled: boolean | null
                    preferred_language: string | null
                    role: Database["public"]["Enums"]["user_role"] | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string
                    display_name?: string | null
                    id?: string
                    notifications_enabled?: boolean | null
                    preferred_language?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string
                    display_name?: string | null
                    id?: string
                    notifications_enabled?: boolean | null
                    preferred_language?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            role_changes: {
                Row: {
                    changed_by: string
                    created_at: string
                    id: string
                    new_role: Database["public"]["Enums"]["user_role"]
                    old_role: Database["public"]["Enums"]["user_role"] | null
                    reason: string | null
                    target_user_id: string
                }
                Insert: {
                    changed_by: string
                    created_at?: string
                    id?: string
                    new_role: Database["public"]["Enums"]["user_role"]
                    old_role?: Database["public"]["Enums"]["user_role"] | null
                    reason?: string | null
                    target_user_id: string
                }
                Update: {
                    changed_by?: string
                    created_at?: string
                    id?: string
                    new_role?: Database["public"]["Enums"]["user_role"]
                    old_role?: Database["public"]["Enums"]["user_role"] | null
                    reason?: string | null
                    target_user_id?: string
                }
                Relationships: []
            }
            site_settings: {
                Row: {
                    accent_color: string | null
                    created_at: string | null
                    default_language: string | null
                    favicon_url: string | null
                    id: string
                    logo_url: string | null
                    og_image_url: string | null
                    primary_color: string | null
                    site_name: string
                    tagline_base: string | null
                    updated_at: string | null
                }
                Insert: {
                    accent_color?: string | null
                    created_at?: string | null
                    default_language?: string | null
                    favicon_url?: string | null
                    id?: string
                    logo_url?: string | null
                    og_image_url?: string | null
                    primary_color?: string | null
                    site_name?: string
                    tagline_base?: string | null
                    updated_at?: string | null
                }
                Update: {
                    accent_color?: string | null
                    created_at?: string | null
                    default_language?: string | null
                    favicon_url?: string | null
                    id?: string
                    logo_url?: string | null
                    og_image_url?: string | null
                    primary_color?: string | null
                    site_name?: string
                    tagline_base?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            team_members: {
                Row: {
                    bio_en: string | null
                    bio_pl: string | null
                    bio_ru: string | null
                    bio_uk: string | null
                    callsign: string
                    created_at: string
                    display_order: number
                    id: string
                    is_active: boolean
                    photo_url: string | null
                    real_name: string | null
                    role_en: string | null
                    role_pl: string
                    role_ru: string
                    role_uk: string
                    social_links: Json | null
                    updated_at: string
                }
                Insert: {
                    bio_en?: string | null
                    bio_pl?: string | null
                    bio_ru?: string | null
                    bio_uk?: string | null
                    callsign: string
                    created_at?: string
                    display_order?: number
                    id?: string
                    is_active?: boolean
                    photo_url?: string | null
                    real_name?: string | null
                    role_en?: string | null
                    role_pl: string
                    role_ru: string
                    role_uk: string
                    social_links?: Json | null
                    updated_at?: string
                }
                Update: {
                    bio_en?: string | null
                    bio_pl?: string | null
                    bio_ru?: string | null
                    bio_uk?: string | null
                    callsign?: string
                    created_at?: string
                    display_order?: number
                    id?: string
                    is_active?: boolean
                    photo_url?: string | null
                    real_name?: string | null
                    role_en?: string | null
                    role_pl?: string
                    role_ru?: string
                    role_uk?: string
                    social_links?: Json | null
                    updated_at?: string
                }
                Relationships: []
            }
            team_settings: {
                Row: {
                    active_members: number | null
                    created_at: string | null
                    games_played: number | null
                    id: string
                    mission_description_en: string
                    mission_description_pl: string
                    mission_description_ru: string
                    mission_description_uk: string
                    mission_title_en: string
                    mission_title_pl: string
                    mission_title_ru: string
                    mission_title_uk: string
                    updated_at: string | null
                    win_rate: number | null
                    years_active: number | null
                }
                Insert: {
                    active_members?: number | null
                    created_at?: string | null
                    games_played?: number | null
                    id?: string
                    mission_description_en: string
                    mission_description_pl: string
                    mission_description_ru: string
                    mission_description_uk: string
                    mission_title_en: string
                    mission_title_pl: string
                    mission_title_ru: string
                    mission_title_uk: string
                    updated_at?: string | null
                    win_rate?: number | null
                    years_active?: number | null
                }
                Update: {
                    active_members?: number | null
                    created_at?: string | null
                    games_played?: number | null
                    id?: string
                    mission_description_en?: string
                    mission_description_pl?: string
                    mission_description_ru?: string
                    mission_description_uk?: string
                    mission_title_en?: string
                    mission_title_pl?: string
                    mission_title_ru?: string
                    mission_title_uk?: string
                    updated_at?: string | null
                    win_rate?: number | null
                    years_active?: number | null
                }
                Relationships: []
            }
            ui_strings: {
                Row: {
                    category: string | null
                    created_at: string | null
                    id: string
                    key: string
                    text_en: string
                    text_pl: string
                    text_ru: string
                    text_uk: string
                    updated_at: string | null
                }
                Insert: {
                    category?: string | null
                    created_at?: string | null
                    id?: string
                    key: string
                    text_en: string
                    text_pl: string
                    text_ru: string
                    text_uk: string
                    updated_at?: string | null
                }
                Update: {
                    category?: string | null
                    created_at?: string | null
                    id?: string
                    key?: string
                    text_en?: string
                    text_pl?: string
                    text_ru?: string
                    text_uk?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            user_favorites: {
                Row: {
                    created_at: string
                    entity_id: string
                    entity_type: Database["public"]["Enums"]["entity_type"]
                    id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    entity_id: string
                    entity_type: Database["public"]["Enums"]["entity_type"]
                    id?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    entity_id?: string
                    entity_type?: Database["public"]["Enums"]["entity_type"]
                    id?: string
                    user_id?: string
                }
                Relationships: []
            }
            user_test_results: {
                Row: {
                    answers: Json | null
                    completed_at: string
                    id: string
                    score: number | null
                    test_id: string
                    user_id: string
                }
                Insert: {
                    answers?: Json | null
                    completed_at?: string
                    id?: string
                    score?: number | null
                    test_id: string
                    user_id: string
                }
                Update: {
                    answers?: Json | null
                    completed_at?: string
                    id?: string
                    score?: number | null
                    test_id?: string
                    user_id?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            change_user_role: {
                Args: {
                    new_role: Database["public"]["Enums"]["user_role"]
                    target_email: string
                }
                Returns: Json
            }
            change_user_role_by_id: {
                Args: {
                    new_role: Database["public"]["Enums"]["user_role"]
                    target_user: string
                }
                Returns: Json
            }
            check_event_cancellation: {
                Args: Record<PropertyKey, never>
                Returns: undefined
            }
            ensure_superadmin_exists: {
                Args: { emergency_email?: string }
                Returns: Json
            }
            fix_profile_ids: {
                Args: Record<PropertyKey, never>
                Returns: undefined
            }
            get_admin_stats: {
                Args: Record<PropertyKey, never>
                Returns: Json
            }
            get_current_user_role: {
                Args: Record<PropertyKey, never>
                Returns: Database["public"]["Enums"]["user_role"]
            }
            get_site_settings: {
                Args: Record<PropertyKey, never>
                Returns: Json
            }
            has_admin_access: {
                Args: { role_name?: string }
                Returns: boolean
            }
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            reorder_team_members: {
                Args: { p_ids: string[]; p_orders: number[] }
                Returns: undefined
            }
            sync_role_to_jwt: {
                Args: { target_user_id?: string }
                Returns: Json
            }
            sync_user_profile: {
                Args: {
                    _avatar_url?: string
                    _display_name?: string
                    _email: string
                    _user_id: string
                }
                Returns: Json
            }
        }
        Enums: {
            article_category:
            | "tactics"
            | "equipment"
            | "news"
            | "game_reports"
            | "rules"
            article_status: "draft" | "published"
            entity_type: "article" | "event" | "media" | "test"
            event_status:
            | "upcoming"
            | "registration_open"
            | "registration_closed"
            | "completed"
            | "cancelled"
            registration_status: "pending" | "approved" | "rejected" | "cancelled"
            user_role: "admin" | "editor" | "user" | "superadmin"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            article_category: [
                "tactics",
                "equipment",
                "news",
                "game_reports",
                "rules",
            ],
            article_status: ["draft", "published"],
            entity_type: ["article", "event", "media", "test"],
            event_status: [
                "upcoming",
                "registration_open",
                "registration_closed",
                "completed",
                "cancelled",
            ],
            registration_status: ["pending", "approved", "rejected", "cancelled"],
            user_role: ["admin", "editor", "user", "superadmin"],
        },
    },
} as const
