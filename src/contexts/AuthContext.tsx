import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hasAdminAccess } from '@/utils/auth';

interface Profile {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    preferred_language: string;
    role: 'superadmin' | 'admin' | 'editor' | 'user';
    bio: string | null;
    notifications_enabled: boolean;
    callsign?: string | null;
    phone?: string | null;
    status?: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    jwtRole: string | null;
    dbRole: string | null;
    rolesSynced: boolean;
    hasAdminAccess: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<{ error: any }>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
    refreshRole: () => Promise<void>;
    syncRoleToJWT: () => Promise<{ error: any }>;
    ensureSuperadmin: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [rolesSynced, setRolesSynced] = useState(false);
    
    // Флаг для предотвращения циклов: игнорируем realtime обновления, если мы сами обновляем профиль
    const isUpdatingProfileRef = useRef(false);

    // Computed values
    const jwtRole = user?.app_metadata?.role || null;
    const dbRole = profile?.role || null;
    const hasAdminAccessValue = hasAdminAccess(dbRole || jwtRole);

    // Subscribe to profile changes for real-time updates
    useEffect(() => {
        if (!user?.id) {
            // Очищаем профиль при выходе пользователя
            setProfile(null);
            return;
        }

        const channel = supabase
            .channel(`profile-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    // 🔥 КРИТИЧНО: Игнорируем realtime обновления, если мы сами обновляем профиль
                    if (isUpdatingProfileRef.current) {
                        console.log('Ignoring realtime update (we are updating profile ourselves)');
                        return;
                    }
                    
                    console.log('Profile updated via realtime:', payload);
                    if (payload.eventType === 'UPDATE' && payload.new) {
                        setProfile(payload.new as Profile);
                        // Check if role sync is needed (без автоматической синхронизации, чтобы избежать циклов)
                        const newDbRole = (payload.new as Profile).role;
                        const currentJwtRole = user?.app_metadata?.role;
                        setRolesSynced(newDbRole === currentJwtRole);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]); // ✅ Правильно: зависимость только от user?.id

    useEffect(() => {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                try {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        // Defer Supabase calls to avoid deadlocks
                        setTimeout(async () => {
                            try {
                                // 🔥 Устанавливаем флаг перед синхронизацией профиля
                                isUpdatingProfileRef.current = true;
                                
                                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                                    await supabase.rpc('sync_user_profile', {
                                        _user_id: session.user.id,
                                        _email: session.user.email || '',
                                        _display_name: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name,
                                        _avatar_url: session.user.user_metadata?.avatar_url
                                    });

                                    // Check for emergency superadmin promotion
                                    await supabase.rpc('ensure_superadmin_exists');
                                }

                                // 🔥 Устанавливаем флаг перед обновлением профиля
                                isUpdatingProfileRef.current = true;
                                
                                const { data: profileData } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', session.user.id)
                                    .maybeSingle();
                                setProfile(profileData ?? null);
                                
                                // 🔥 Сбрасываем флаг после небольшой задержки
                                setTimeout(() => {
                                    isUpdatingProfileRef.current = false;
                                }, 1000);

                                // Check role synchronization (без автоматической синхронизации, чтобы избежать циклов)
                                if (profileData) {
                                    const jwtRole = session.user.app_metadata?.role;
                                    const dbRole = profileData.role;
                                    setRolesSynced(jwtRole === dbRole);
                                    // Убрана автоматическая синхронизация, чтобы избежать бесконечных циклов
                                    // Синхронизацию можно вызвать вручную через syncRoleToJWT()
                                }
                            } catch (error) {
                                console.error('Auth state profile sync error:', error);
                                setProfile(null);
                                isUpdatingProfileRef.current = false;
                            } finally {
                                setLoading(false);
                            }
                        }, 0);
                    } else {
                        setProfile(null);
                        setRolesSynced(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.warn('Auth state change error:', error);
                    setProfile(null);
                    setRolesSynced(false);
                    setLoading(false);
                }
            }
        );

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            try {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // 🔥 Устанавливаем флаг перед синхронизацией профиля
                    isUpdatingProfileRef.current = true;
                    
                    // Sync user profile on initial load
                    try {
                        await supabase.rpc('sync_user_profile', {
                            _user_id: session.user.id,
                            _email: session.user.email || '',
                            _display_name: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name,
                            _avatar_url: session.user.user_metadata?.avatar_url
                        });
                    } catch (error) {
                        console.warn('Error syncing user profile:', error);
                    }

                    // Fetch user profile
                    try {
                        // 🔥 Устанавливаем флаг перед обновлением профиля
                        isUpdatingProfileRef.current = true;
                        
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        setProfile(profileData);
                        
                        // 🔥 Сбрасываем флаг после небольшой задержки
                        setTimeout(() => {
                            isUpdatingProfileRef.current = false;
                        }, 1000);
                    } catch (error) {
                        console.warn('Error fetching user profile:', error);
                        setProfile(null);
                        isUpdatingProfileRef.current = false;
                    }
                }
            } catch (error) {
                console.warn('Error getting initial session:', error);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        }).catch((error) => {
            console.warn('Error in getSession:', error);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []); // ✅ Правильно: пустой массив - запускается только один раз при монтировании

    const signUp = async (email: string, password: string, displayName: string) => {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    display_name: displayName
                }
            }
        });

        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
            // Убрали redirectTo, так как редирект обрабатывается вручную в CreativeAuthPage
        });

        return { error };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`
            }
        });

        return { error };
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (!error) {
                // Очищаем состояние после успешного выхода
                setUser(null);
                setProfile(null);
                setSession(null);
                setRolesSynced(false);
            }
            return { error };
        } catch (error: any) {
            console.error('Sign out error:', error);
            return { error };
        }
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        return { error };
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: new Error('No user logged in') };

        // 🔥 Устанавливаем флаг перед обновлением
        isUpdatingProfileRef.current = true;
        
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (!error && profile) {
            setProfile({ ...profile, ...updates });
        }
        
        // 🔥 Сбрасываем флаг после обновления
        setTimeout(() => {
            isUpdatingProfileRef.current = false;
        }, 1000);

        return { error };
    };

    const refreshRole = async () => {
        if (!user) return;

        try {
            // 🔥 Устанавливаем флаг перед обновлением
            isUpdatingProfileRef.current = true;
            
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setRolesSynced(user.app_metadata?.role === profileData.role);
            }
            
            // 🔥 Сбрасываем флаг после обновления
            setTimeout(() => {
                isUpdatingProfileRef.current = false;
            }, 1000);
        } catch (error) {
            console.error('Error refreshing role:', error);
            isUpdatingProfileRef.current = false;
        }
    };

    const syncRoleToJWT = async () => {
        if (!user) return { error: new Error('No user logged in') };

        try {
            const { data, error } = await supabase.rpc('sync_role_to_jwt');

            if (error) throw error;

            // Refresh session to get updated JWT
            await supabase.auth.refreshSession();

            setRolesSynced(true);
            return { error: null };
        } catch (error: any) {
            console.error('Error syncing role to JWT:', error);
            return { error };
        }
    };

    const ensureSuperadmin = async () => {
        try {
            const { data, error } = await supabase.rpc('ensure_superadmin_exists');

            if (error) throw error;

            // Refresh to get updated profile
            await refreshRole();

            return { error: null };
        } catch (error: any) {
            console.error('Error ensuring superadmin:', error);
            return { error };
        }
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        jwtRole,
        dbRole,
        rolesSynced,
        hasAdminAccess: hasAdminAccessValue,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        refreshRole,
        syncRoleToJWT,
        ensureSuperadmin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};