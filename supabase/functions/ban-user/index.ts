// supabase/functions/ban-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS "кувалда"
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Метод не дозволений' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 1) payload
        const { userIdToBan, reason } = await req.json();
        if (!userIdToBan) {
            throw new Error('Необхідно вказати ID користувача для бану');
        }

        // 2) admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 3) auth requester
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Необхідна авторизація');
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: requester } } = await supabaseAdmin.auth.getUser(token);
        if (!requester) {
            throw new Error('Недійсний токен');
        }

        // roles
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();
        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userIdToBan)
            .single();

        const requesterRole = requesterProfile?.role?.toLowerCase();
        const targetRole = targetProfile?.role?.toLowerCase();

        if (!requesterRole || !['admin', 'superadmin'].includes(requesterRole)) {
            return new Response(JSON.stringify({ error: '403: Тільки Адміни можуть банити' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        if (targetRole === 'superadmin') {
            return new Response(JSON.stringify({ error: '403: Ви не можете забанити Суперадміна' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        if (requesterRole === 'admin' && targetRole === 'admin') {
            return new Response(JSON.stringify({ error: '403: Адмін не може забанити іншого Адміна' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 5) ban
        const farFuture = '2999-01-01T00:00:00Z';
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userIdToBan, { banned_until: farFuture });
        if (authError) throw authError;

        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'suspended' })
            .eq('id', userIdToBan);
        if (dbError) throw dbError;

        // optional: log reason (skipped)

        return new Response(JSON.stringify({ message: 'Користувач успішно заблокований', reason: reason ?? null }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});


