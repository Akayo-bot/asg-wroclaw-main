// supabase/functions/get-user-details/index.ts

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
        // 1. Отримуємо ID юзера
        const url = new URL(req.url);
        const targetUserId = url.searchParams.get('userId');
        if (!targetUserId) {
            throw new Error('Необхідно вказати ID користувача');
        }

        // 2. Створюємо АДМІНСЬКИЙ клієнт
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 3. ПЕРЕВІРКА БЕЗПЕКИ: Хто робить запит?
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user: requester } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!requester) {
            throw new Error('Недійсний токен');
        }

        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (requesterProfile?.role.toLowerCase() !== 'superadmin') {
            return new Response(
                JSON.stringify({ error: '403: Доступ заборонено' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Отримання даних
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (authError) throw authError;

        const { data: profileData, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();
        if (dbError) throw dbError;

        const fullUserProfile = {
            ...profileData,
            email: authData.user.email,
            created_at: authData.user.created_at,
            last_sign_in_at: authData.user.last_sign_in_at,
        };

        // 5. Віддаємо дані
        return new Response(JSON.stringify(fullUserProfile), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});