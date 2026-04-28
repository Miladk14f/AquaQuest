import { supabase } from "./supabase.js";

export async function signUpWithEmail(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: username } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(emailOrUsername, password) {
  let email = emailOrUsername;

  if (!emailOrUsername.includes("@")) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("username", emailOrUsername)
      .single();
    if (error || !data?.email) throw new Error("No account found with that username.");
    email = data.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/profile` },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from("user_rankings")
    .select("*")
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function awardPoints(userId, questId, eventType, points) {
  if (!supabase || !userId) return;
  const { error: evtError } = await supabase
    .from("user_point_events")
    .insert({ user_id: userId, quest_id: questId, event_type: eventType, points });
  if (evtError) throw evtError;

  const { error: updError } = await supabase.rpc("increment_user_points", {
    p_user_id: userId,
    p_points:  points,
    p_photos:  eventType === "photo_upload" ? 1 : 0,
  });
  if (updError) {
    // Fallback if RPC not created yet — direct update
    const { data: prof } = await supabase
      .from("user_profiles")
      .select("total_points, photos_submitted")
      .eq("id", userId)
      .single();
    await supabase.from("user_profiles").update({
      total_points:     (prof?.total_points || 0) + points,
      photos_submitted: (prof?.photos_submitted || 0) + (eventType === "photo_upload" ? 1 : 0),
    }).eq("id", userId);
  }
}
