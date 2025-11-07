// hooks/useActivityLog.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogItem {
    id: string;
    user_id: string;
    action_type: string;
    details: any;
    created_at: string;
    user?: {
        display_name: string | null;
        email: string | null;
        role?: string | null;
        status?: string | null;
    };
}

export const useActivityLog = (limit: number = 10) => {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            
            try {
                console.log('[useActivityLog] Fetching activity logs...');
                
                // Сначала получаем логи без связи с profiles
                const { data, error } = await supabase
                    .from('activity_log')
                    .select(`
                        id,
                        user_id,
                        action_type,
                        details,
                        created_at
                    `)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) {
                    console.error('[useActivityLog] Error fetching activity log:', {
                        error,
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    setIsLoading(false);
                    return;
                }

                console.log('[useActivityLog] Fetched logs:', data?.length || 0, 'items');

                // Если есть логи, получаем информацию о пользователях
                if (data && data.length > 0) {
                    const userIds = [...new Set(data.map(log => log.user_id))];
                    
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, display_name, email, role, status')
                        .in('id', userIds);

                    if (profilesError) {
                        console.error('[useActivityLog] Error fetching profiles:', profilesError);
                    }

                    // Создаем мапу профилей для быстрого доступа
                    const profilesMap = new Map();
                    if (profilesData) {
                        profilesData.forEach(profile => {
                            profilesMap.set(profile.id, profile);
                        });
                    }

                    // Трансформуємо дані для зручності и фильтруем логи скрытых пользователей
                    const transformedLogs = data
                        .map((log: any) => {
                            const profile = profilesMap.get(log.user_id);
                            return {
                                id: log.id,
                                user_id: log.user_id,
                                action_type: log.action_type,
                                details: log.details,
                                created_at: log.created_at,
                                user: profile ? {
                                    display_name: profile.display_name,
                                    email: profile.email,
                                    role: profile.role,
                                    status: profile.status,
                                } : undefined,
                            };
                        })
                        .filter((log: ActivityLogItem) => {
                            // Фильтруем логи пользователей со статусом 'hidden'
                            if (!log.user) {
                                // Если профиль не найден, оставляем лог (на случай, если пользователь был удален)
                                return true;
                            }
                            return log.user.status !== 'hidden';
                        });

                    console.log('[useActivityLog] Transformed logs (after filtering hidden users):', transformedLogs);
                    setLogs(transformedLogs);
                } else {
                    console.log('[useActivityLog] No logs found');
                    setLogs([]);
                }
            } catch (error) {
                console.error('[useActivityLog] Unexpected error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();

        // Підписка на оновлення в реальному часі
        const channel = supabase
            .channel('activity_log_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_log',
                },
                () => {
                    // Оновлюємо логи при новій дії
                    fetchLogs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [limit]);

    return { logs, isLoading };
};

