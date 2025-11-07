// supabase/functions/unban-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Вписуємо "кувалду" CORS прямо сюди
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Дозволити ВСІ домени
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
    // --- НАЙГОЛОВНІШИЙ БЛОК ---
    // Відповідаємо "OK" на будь-який запит 'OPTIONS'
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    // -------------------------

    try {
        // 1. Отримуємо ID, кого розбанити
        const { userIdToUnban } = await req.json();
        if (!userIdToUnban) {
            return new Response(
                JSON.stringify({ error: 'Необхідно вказати ID користувача для розбану' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Створюємо АДМІНСЬКИЙ клієнт (сервісний ключ для обходу RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        // 3. ПЕРЕВІРКА БЕЗПЕКИ: Хто робить запит?
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Необхідна авторизація' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: { user: requester } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!requester) {
            return new Response(
                JSON.stringify({ error: 'Недійсний токен' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();

        const requesterRole = requesterProfile?.role?.toLowerCase();

        // 4. 🔥 "ФЕЙС-КОНТРОЛЬ" (Тільки адміни можуть розбанити)
        if (!requesterRole || !['admin', 'superadmin'].includes(requesterRole)) {
            return new Response(
                JSON.stringify({ error: '403: Тільки Адміни можуть розбанити' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 5. ЛОГІКА РОЗБАНУ
        // А. Дозволяємо вхід в 'auth.users' (требует сервісного ключа)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userIdToUnban,
            { banned_until: null }
        );
        if (authError) {
            return new Response(
                JSON.stringify({ error: `Помилка оновлення auth: ${authError.message}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Б. Встановлюємо статус 'active' в 'public.profiles' (щоб він став активним)
        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', userIdToUnban);
        
        if (dbError) {
            return new Response(
                JSON.stringify({ error: `Помилка оновлення профілю: ${dbError.message}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 6. Віддаємо успішну відповідь
        return new Response(JSON.stringify({ message: 'Користувач успішно розблокований' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

