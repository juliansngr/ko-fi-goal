import { createClient } from "@/lib/supabase/serverClient";

export async function POST(req) {
  const supabase = await createClient();

  // 1. Validierung des Signatures-Headers gegen KOFI_WEBHOOK_SECRET

  console.log(req.body);
  const { data } = req.body;
  if (data.verification_token !== process.env.KOFI_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Amount extrahieren
  const amount = data.amount;

  const amountInCents = Math.round(amount * 100);

  // 3. Counter inkrementieren (in Cent oder Ganzzahl)
  await supabase
    .from("goals")
    .eq("id", 1)
    .upsert({ amount_in_cents: amountInCents });

  return new Response("OK", { status: 200 });
}
