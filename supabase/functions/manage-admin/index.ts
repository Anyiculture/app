// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Verify Requestor is Admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Check admin table
    const { data: adminRole, error: roleError } = await supabaseClient
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .single();

    if (roleError || !adminRole) {
      throw new Error('Forbidden: Admin access required');
    }

    // Initialize Admin Client (for user management operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action'); // list, add, remove

    if (action === 'list') {
      // List all admins
      const { data: roles, error: rolesErr } = await supabaseAdmin
        .from('admin_roles')
        .select('user_id, created_at, is_active')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (rolesErr) throw rolesErr;

      // Enrich with email from auth.users (requires getUserById loop or listUsers)
      // Since listUsers is paginated, fetching specific IDs is better if possible, but admin.listUsers doesn't filter by IDs easily.
      // We'll fetch users and map.
      const adminIds = roles.map(r => r.user_id);
      
      // Fetch all users (simplest for now, though inefficient for large userbases)
      // Better: Iterate IDs and fetch.
      const enrichedAdmins = [];
      for (const role of roles) {
        const { data: { user: u }, error: uErr } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
        if (u && !uErr) {
          enrichedAdmins.push({
            id: u.id,
            email: u.email,
            joined_at: role.created_at,
          });
        }
      }

      return new Response(JSON.stringify({ admins: enrichedAdmins }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      const { email } = await req.json();
      if (!email) throw new Error('Email is required');

      // Find user by email
      // listUsers doesn't support filter by email directly in all versions, but we can search or filter result.
      // Actually, standard listUsers doesn't filter.
      // Efficient way: try to create a user, catch if exists? No.
      // We have to list users and find.
      // Or use `generateLink` tricks? No.
      // Use `admin.listUsers` likely returns most.
      
      // Let's try to find user by filtering list (up to page limit).
      // Ideally we would use a lookup table or rpc, but service key allows `listUsers`.
      
      // Note: supabase-js 2.39+ might support getUserByEmail? No, mainly generic methods.
      // We will assume the user exists for now.
      
      // WORKAROUND: We can't easily look up ID by Email without listing/scanning.
      // Let's scan first 100 users.
      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) throw listErr;

      const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!targetUser) {
        throw new Error(`User ${email} not found. They must sign up first.`);
      }

      // Add to admin_roles
      const { error: insertErr } = await supabaseAdmin
        .from('admin_roles')
        .upsert({ 
            user_id: targetUser.id, 
            role: 'admin', 
            permissions: ['all'],
            is_active: true 
        }, { onConflict: 'user_id, role' });

      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove') {
      const { userId } = await req.json();
      if (!userId) throw new Error('User ID is required');

      // Prevent self-removal
      if (userId === user.id) {
         throw new Error('Cannot remove yourself');
      }

      const { error: deleteErr } = await supabaseAdmin
        .from('admin_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (deleteErr) throw deleteErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
