"use server";

import { createClient } from "@/lib/supabase/serverClient";

export async function updateGoal(formData) {
  const amount = parseFloat(formData.get("amount"));
  const amountInCents = Math.round(amount * 100);

  const goalText = formData.get("goalText");
  const showSecondHalf = formData.get("showSecondHalf");
  const displayImage = formData.get("displayImage");

  const secondHalfAmount = formData.get("secondHalfAmount");
  const secondHalfAmountInCents = Math.round(secondHalfAmount * 100);

  const supabase = await createClient();
  await supabase
    .from("goals")
    .update({
      amount_in_cents: amountInCents,
      goal_text: goalText,
      show_second_half: showSecondHalf,
      display_img: displayImage,
      second_amount: secondHalfAmountInCents,
    })
    .eq("id", 1);
}
