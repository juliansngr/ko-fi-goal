"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";

export default function GoalOverlay() {
  const [goal, setGoal] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGoal() {
      const { data, error } = await supabase
        .from("goals")
        .select("amount_in_cents")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setGoal((data.amount_in_cents / 100).toFixed(2));
      }
    }

    fetchGoal();
  }, []);

  useEffect(() => {
    // Channel-Name frei wählbar, hier "realtime-goals"
    const channel = supabase
      .channel("realtime-goals")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "goals",
          filter: `id=eq.1`,
        },
        (payload) => {
          // payload.new enthält die neue Zeile
          setGoal((payload.new.amount_in_cents / 100).toFixed(2));
        }
      )
      .subscribe();

    return () => {
      // Sauberes Unsubscribe beim Unmount
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col items-left py-6">
      <p className="text-4xl text-white text-left font-nunito text-stroke-sm">
        {goal ? `☕ Ko‑Fi Goal: €${goal}` : "Lade…"}
      </p>
    </div>
  );
}
