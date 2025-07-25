"use client";

import { updateGoal } from "./actions";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import Image from "next/image";

export default function Home() {
  const [goal, setGoal] = useState(0);
  const [showSecondHalf, setShowSecondHalf] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [secondHalfAmount, setSecondHalfAmount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGoal() {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setGoal((data.amount_in_cents / 100).toFixed(2));
        setShowSecondHalf(data.show_second_half);
        setGoalText(data.goal_text);
        setSecondHalfAmount(data.second_amount);
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
          setShowSecondHalf(payload.new.show_second_half);
          setGoalText(payload.new.goal_text);
          setSecondHalfAmount(payload.new.second_amount / 100);
        }
      )
      .subscribe();

    return () => {
      // Sauberes Unsubscribe beim Unmount
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (formData) => {
    await updateGoal(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 w-full max-w-md">
        <div className="flex flex-row items-center justify-center gap-4">
          <Image
            src="/logo.png"
            alt="Ko-Fi Logo"
            width={50}
            height={50}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-white text-center mb-4">
            Ko-Fi Goal
          </h1>
        </div>
        <p className="text-white text-xl text-center mb-4">
          {goal ? `Aktuell: €${goal}` : "Lade…"}
        </p>

        <form action={handleSubmit} className="flex flex-col space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="goalText"
              className="text-white text-sm font-medium"
            >
              Goal Text
            </label>
            <input
              id="goalText"
              type="text"
              name="goalText"
              defaultValue={goalText}
              placeholder="Goal Text"
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
            />
            <label htmlFor="amount" className="text-white text-sm font-medium">
              Momentaner Betrag (€)
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              step="0.01"
              defaultValue={goal}
              min="0"
              placeholder="Betrag eingeben..."
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="showSecondHalf"
              className="text-white text-sm font-medium"
            >
              Zeige zweite Hälfte?
            </label>
            <input
              id="showSecondHalf"
              type="checkbox"
              name="showSecondHalf"
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
              checked={showSecondHalf}
              onChange={(e) => {
                setShowSecondHalf(e.target.checked);
              }}
            />
          </div>
          {showSecondHalf && (
            <div className="space-y-2">
              <label
                htmlFor="secondHalfAmount"
                className="text-white text-sm font-medium"
              >
                Zweite Hälfte (€)
              </label>
              <input
                id="secondHalfAmount"
                type="number"
                name="secondHalfAmount"
                step="0.01"
                defaultValue={secondHalfAmount}
                min="0"
                placeholder="Betrag eingeben..."
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Goal setzen 🎯
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            Setze dein Ko-Fi Spendenziel und verfolge den Fortschritt!
          </p>
        </div>
      </div>
    </div>
  );
}
