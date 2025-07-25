import { createClient } from "@/lib/supabase/serverClient";

export async function POST(req) {
  const supabase = await createClient();

  const raw = await req.text();
  console.log("🪵 Raw body:", raw);

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
  console.log("🪵 Parsed Ko‑fi payload:", payload);

  const amount = payload.amount;

  const amountInCents = Math.round(amount * 100);

  // 3. Counter inkrementieren (in Cent oder Ganzzahl)
  await supabase
    .from("goals")
    .eq("id", 1)
    .upsert({ amount_in_cents: amountInCents });

  return new Response("OK", { status: 200 });
}
