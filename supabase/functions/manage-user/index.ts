import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Não autorizado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) return json({ error: "Apenas administradores" }, 403);

    const body = await req.json();
    const { action, user_id } = body;
    if (!action || !user_id) return json({ error: "action e user_id são obrigatórios" }, 400);

    const audit = async (targetEmail: string | null, details: Record<string, unknown> = {}) => {
      await admin.from("user_audit_logs").insert({
        actor_id: caller.id,
        actor_email: caller.email ?? null,
        target_user_id: user_id,
        target_email: targetEmail,
        action,
        details,
      });
    };

    if (action === "update_profile") {
      const { full_name, email, active } = body;
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email;
      if (active !== undefined) updates.active = active;

      if (Object.keys(updates).length > 0) {
        const { error } = await admin.from("profiles").update(updates).eq("user_id", user_id);
        if (error) return json({ error: error.message }, 400);
      }
      if (email) {
        const { error: e2 } = await admin.auth.admin.updateUserById(user_id, { email });
        if (e2) return json({ error: e2.message }, 400);
      }
      if (active === false) {
        await admin.auth.admin.updateUserById(user_id, { ban_duration: "876000h" });
      } else if (active === true) {
        await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      }
      await audit(email ?? null, updates);
      return json({ success: true });
    }

    if (action === "update_role") {
      const { role } = body;
      if (!["cliente", "controlador", "admin"].includes(role)) return json({ error: "Perfil inválido" }, 400);
      await admin.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await admin.from("user_roles").insert({ user_id, role });
      if (error) return json({ error: error.message }, 400);
      await audit(null, { role });
      return json({ success: true });
    }

    if (action === "update_hospitals") {
      const hospital_ids: string[] = Array.isArray(body.hospital_ids) ? body.hospital_ids : [];
      await admin.from("user_hospital_assignments").delete().eq("user_id", user_id);
      if (hospital_ids.length > 0) {
        const rows = hospital_ids.map((h) => ({ user_id, hospital_id: h }));
        const { error } = await admin.from("user_hospital_assignments").insert(rows);
        if (error) return json({ error: error.message }, 400);
      }
      await audit(null, { hospital_ids });
      return json({ success: true });
    }

    if (action === "reset_password") {
      const { password, force_change } = body;
      if (!password || password.length < 6) return json({ error: "Senha mínima de 6 caracteres" }, 400);
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) return json({ error: error.message }, 400);
      if (force_change) {
        await admin.from("profiles").update({ force_password_change: true }).eq("user_id", user_id);
      }
      await audit(null, { force_change: !!force_change });
      return json({ success: true });
    }

    if (action === "delete_user") {
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      await audit(null, {});
      return json({ success: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
