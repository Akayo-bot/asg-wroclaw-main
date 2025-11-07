// supabase/functions/_shared/cors.ts

export const corsHeaders = {
    // "КУВАЛДА": Дозволяємо доступ з БУДЬ-ЯКОГО домену
    'Access-Control-Allow-Origin': '*',

    // Дозволяємо всі можливі заголовки
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

    // Дозволяємо всі методи
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};