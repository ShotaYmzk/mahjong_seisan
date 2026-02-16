import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build/SSG, env vars may not be available.
    // Return a dummy client that will be replaced at runtime.
    return createBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  client = createBrowserClient<Database>(url, key);
  return client;
}

/**
 * Helper to insert an activity log entry.
 * Centralizes the type casting needed for the `detail` jsonb field.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string | null | undefined,
  action: string,
  detail: Record<string, unknown>
) {
  return supabase.from("activity_log").insert({
    session_id: sessionId,
    user_id: userId ?? null,
    action,
    detail: detail as unknown as Database["public"]["Tables"]["activity_log"]["Insert"]["detail"],
  });
}
