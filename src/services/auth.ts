import { supabase } from "./supabaseClient.ts";

export async function signUp(email: string, password: string, pseudo: string, handColor: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return { error: authError };

  const user = authData.user;
  if (!user) return { error: new Error("Utilisateur non créé") };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    pseudo,
    hand_color: handColor,
    lang: "fr",
  });

  return { data: authData, error: profileError };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
