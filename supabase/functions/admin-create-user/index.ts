import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUser = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !callerUser) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: ' + (authError?.message || 'No user found') }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: callerProfile } = await supabaseUser
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single();

        if (!callerProfile || !['superadmin', 'admin'].includes(callerProfile.role)) {
            return new Response(
                JSON.stringify({ error: 'Forbidden: Only admin/superadmin can create users' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { email, password, nama_lengkap, role, unit_id, whatsapp } = await req.json();

        if (!email || !password || !nama_lengkap) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: nama_lengkap, role: role || 'user' }
        });

        if (createError) {
            return new Response(
                JSON.stringify({ error: createError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (newUser.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: newUser.user.id,
                    email,
                    nama_lengkap,
                    role: role || 'user',
                    unit_id: unit_id || null,
                    whatsapp: whatsapp || null,
                    is_active: true
                }, { onConflict: 'id' });

            if (profileError) {
                return new Response(
                    JSON.stringify({ error: 'User created but profile failed: ' + profileError.message, user: newUser.user }),
                    { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        return new Response(
            JSON.stringify({ success: true, user: newUser.user }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
