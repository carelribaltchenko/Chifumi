import { supabase } from "./supabaseClient";

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}



export async function updateProfile(pseudo: string, handColor: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Non connecté") };
  
    const { error } = await supabase
      .from("profiles")
      .update({ pseudo, hand_color: handColor })
      .eq("id", user.id);
  
    return { error };
  }