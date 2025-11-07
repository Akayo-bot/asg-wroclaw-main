// utils/activityLogger.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Типи дій для логування
 */
export type ActivityActionType = 
    | 'ARTICLE_CREATE'
    | 'ARTICLE_UPDATE'
    | 'ARTICLE_DELETE'
    | 'ARTICLE_PUBLISH'
    | 'ROLE_UPDATE'
    | 'USER_BAN'
    | 'USER_UNBAN'
    | 'EVENT_CREATE'
    | 'EVENT_UPDATE'
    | 'EVENT_DELETE'
    | 'GALLERY_ADD'
    | 'GALLERY_DELETE'
    | 'TEAM_ADD'
    | 'TEAM_UPDATE'
    | 'TEAM_DELETE'
    | 'SETTINGS_UPDATE'
    | 'TRANSLATION_UPDATE';

/**
 * Деталі дії (може бути будь-яким об'єктом)
 */
export interface ActivityDetails {
    [key: string]: any;
}

/**
 * Логує дію користувача в базу даних
 * @param actionType Тип дії (наприклад, 'ARTICLE_CREATE')
 * @param details Деталі дії (наприклад, { title: 'Назва статті', articleId: '123' })
 */
export async function logActivity(actionType: ActivityActionType, details: ActivityDetails = {}) {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('[ActivityLogger] Error getting user:', userError);
            return;
        }
        
        if (!user) {
            console.warn('[ActivityLogger] Attempted to log activity without a user.');
            return;
        }

        console.log('[ActivityLogger] Attempting to log activity:', {
            actionType,
            userId: user.id,
            details
        });

        // Проверяем, существует ли таблица activity_log
        const { data: testData, error: testError } = await supabase
            .from('activity_log')
            .select('id')
            .limit(1);

        if (testError && testError.code === '42P01') {
            console.error('[ActivityLogger] Table "activity_log" does not exist!');
            return;
        }

        const insertData = {
            user_id: user.id,
            action_type: actionType,
            details: details,
        };

        console.log('[ActivityLogger] Inserting data:', insertData);

        const { data, error } = await supabase
            .from('activity_log')
            .insert(insertData)
            .select();

        if (error) {
            console.error('[ActivityLogger] Error logging activity:', {
                error,
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                insertData
            });
            
            // Показываем пользователю ошибку только в консоли
            if (error.code === '42501') {
                console.error('[ActivityLogger] Permission denied - check RLS policies!');
            }
        } else {
            console.log(`[ActivityLogger] Successfully logged activity: ${actionType}`, {
                insertedData: data,
                details
            });
        }
    } catch (error) {
        console.error('[ActivityLogger] Unexpected error:', error);
    }
}

/**
 * Тестовая функция для проверки работы логирования
 * Вызовите эту функцию из консоли браузера: window.testActivityLog()
 */
export async function testActivityLog() {
    console.log('[ActivityLogger] Testing activity log...');
    await logActivity('SETTINGS_UPDATE', {
        test: true,
        message: 'This is a test log entry'
    });
    console.log('[ActivityLogger] Test completed. Check the console for errors.');
}

// Добавляем функцию в window для тестирования
if (typeof window !== 'undefined') {
    (window as any).testActivityLog = testActivityLog;
}

