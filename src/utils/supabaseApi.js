import { supabase } from "./supabaseClient";

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveInvoice(invoice) {
  const { data, error } = await supabase
    .from("invoices")
    .upsert(invoice, { onConflict: "invoice_number" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveClient(client) {
  const { data, error } = await supabase
    .from("clients")
    .upsert(client, { onConflict: "email" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function recordPayment(payment) {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchRetainers() {
  const { data, error } = await supabase
    .from("retainers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveRetainer(retainer) {
  const { data, error } = await supabase
    .from("retainers")
    .insert(retainer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRetainer(id, changes) {
  const { data, error } = await supabase
    .from("retainers")
    .update(changes)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeRetainer(id) {
  const { error } = await supabase.from("retainers").delete().eq("id", id);
  if (error) throw error;
}
