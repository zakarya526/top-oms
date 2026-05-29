// create-user Edge Function
//
// Lets a restaurant admin add a staff member (waiter/kitchen). Creating an auth
// user requires the service-role key, which must never reach the client — so it
// lives here.
//
// Security model:
//   * The caller is identified from their JWT (functions.invoke forwards it).
//   * We confirm the caller is an ACTIVE ADMIN and read THEIR restaurant_id from
//     the database. The restaurant_id is never taken from the request body, so an
//     admin of restaurant A can never create a user in restaurant B.
//   * If the profile insert fails, the orphaned auth user is rolled back.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = ["waiter", "kitchen", "admin"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify the caller from their JWT.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();
    if (callerErr || !caller) {
      return json({ error: "Invalid or expired session" }, 401);
    }

    // Service-role client (bypasses RLS) for verification + privileged writes.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerProfile, error: profileErr } = await admin
      .from("user_profiles")
      .select("restaurant_id, role, is_active")
      .eq("id", caller.id)
      .single();

    if (profileErr || !callerProfile) {
      return json({ error: "Caller profile not found" }, 403);
    }
    if (callerProfile.role !== "admin" || !callerProfile.is_active) {
      return json({ error: "Only an active admin can create users" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const role = String(body.role ?? "");

    if (!email || !password || !fullName) {
      return json({ error: "email, password and full_name are required" }, 400);
    }
    if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return json({ error: "role must be one of waiter, kitchen, admin" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "password must be at least 6 characters" }, 400);
    }

    // Create the auth user, pre-confirmed so staff can sign in immediately.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    }

    // Attach the profile to the ADMIN'S restaurant.
    const { error: insertErr } = await admin.from("user_profiles").insert({
      id: created.user.id,
      restaurant_id: callerProfile.restaurant_id,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (insertErr) {
      // Roll back so we don't leave an auth user with no profile.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: insertErr.message }, 400);
    }

    return json({ user_id: created.user.id }, 200);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
