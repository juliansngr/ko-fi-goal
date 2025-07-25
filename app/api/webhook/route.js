import { createClient } from "@/lib/supabase/serverClient";

export async function POST(req) {
  const supabase = await createClient();

  const raw = await req.text();

  const params = new URLSearchParams(raw);
  const dataField = params.get("data");
  if (!dataField) {
    console.error("Missing data field in form payload");
    return new Response("Bad Request", { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(dataField);
  } catch (err) {
    console.error("Invalid JSON in data field:", dataField, err);
    return new Response("Bad Request: invalid JSON", { status: 400 });
  }

  const amount = payload.amount;

  const amountInCents = Math.round(amount * 100);

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching goal:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  const newTotal = data.amount_in_cents + amountInCents;

  await supabase
    .from("goals")
    .update({ amount_in_cents: newTotal })
    .eq("id", 1);

  return new Response("OK", { status: 200 });
}
