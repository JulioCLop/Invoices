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
  const base = supabase.from("clients");
  const query = client.id
    ? base.upsert(client, { onConflict: "id" })
    : base.insert(client);
  const { data, error } = await query.select().single();
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

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveExpense(expense) {
  const base = supabase.from("expenses");
  const query = expense.id
    ? base.upsert(expense, { onConflict: "id" })
    : base.insert(expense);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function updateExpenseStatus(id, status) {
  const { data, error } = await supabase
    .from("expenses")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchTaxRemittances() {
  const { data, error } = await supabase
    .from("tax_remittances")
    .select("*")
    .order("due_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveTaxRemittance(remittance) {
  const base = supabase.from("tax_remittances");
  const query = remittance.id
    ? base.upsert(remittance, { onConflict: "id" })
    : base.insert(remittance);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function updateTaxRemittance(id, changes) {
  const { data, error } = await supabase
    .from("tax_remittances")
    .update(changes)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveQuote(quote) {
  const base = supabase.from("quotes");
  const query = quote.id
    ? base.upsert(quote, { onConflict: "id" })
    : base.insert(quote);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function fetchScheduleEvents() {
  const { data, error } = await supabase
    .from("schedule_events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function saveScheduleEvent(event) {
  const base = supabase.from("schedule_events");
  const query = event.id
    ? base.upsert(event, { onConflict: "id" })
    : base.insert(event);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function updateScheduleStatus(id, status) {
  const { data, error } = await supabase
    .from("schedule_events")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScheduleEvent(id) {
  const { error } = await supabase.from("schedule_events").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchExecutionTasks() {
  const { data, error } = await supabase
    .from("execution_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveExecutionTask(task) {
  const base = supabase.from("execution_tasks");
  const query = task.id
    ? base.upsert(task, { onConflict: "id" })
    : base.insert(task);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function updateExecutionTask(id, changes) {
  const { data, error } = await supabase
    .from("execution_tasks")
    .update(changes)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExecutionTask(id) {
  const { error } = await supabase.from("execution_tasks").delete().eq("id", id);
  if (error) throw error;
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
