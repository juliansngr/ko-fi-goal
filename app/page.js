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
  const [displayImage, setDisplayImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
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
        setSecondHalfAmount((data.second_amount / 100).toFixed(2));
        setDisplayImage(data.display_img || false);
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
          setSecondHalfAmount((payload.new.second_amount / 100).toFixed(2));
          setDisplayImage(payload.new.display_img || false);
        }
      )
      .subscribe();

    return () => {
      // Sauberes Unsubscribe beim Unmount
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setShowSuccess(false);
    setShowError(false);

    try {
      await updateGoal(formData);
      setShowSuccess(true);

      // Success-Nachricht nach 3 Sekunden ausblenden
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating goal:", error);
      setShowError(true);

      // Error-Nachricht nach 5 Sekunden ausblenden
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Feedback Messages - fixed at top */}
      {(showSuccess || showError) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          {/* Success Message */}
          {showSuccess && (
            <div className="transition-all duration-500 ease-in-out transform opacity-100 translate-y-0 scale-100 animate-pulse">
              <div className="bg-gradient-to-r from-green-500/90 to-emerald-600/90 backdrop-blur-md border border-green-400/50 rounded-xl p-4 text-center shadow-2xl">
                <div className="flex items-center justify-center gap-2 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold">
                    Erfolgreich gespeichert! ✅
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="transition-all duration-500 ease-in-out transform opacity-100 translate-y-0 scale-100 animate-pulse">
              <div className="bg-gradient-to-r from-red-500/90 to-rose-600/90 backdrop-blur-md border border-red-400/50 rounded-xl p-4 text-center shadow-2xl">
                <div className="flex items-center justify-center gap-2 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold">
                    Fehler beim Speichern! ⚠️
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
            {/* Display Image Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-col">
                  <label
                    htmlFor="displayImage"
                    className="text-white text-base font-medium cursor-pointer"
                  >
                    Bild anzeigen
                  </label>
                  <span className="text-white/70 text-sm">
                    Aktiviere die Bildanzeige für das Goal
                  </span>
                </div>

                {/* Custom Toggle Switch */}
                <div className="relative">
                  <input
                    id="displayImage"
                    type="checkbox"
                    name="displayImage"
                    className="sr-only"
                    checked={displayImage}
                    onChange={(e) => {
                      setDisplayImage(e.target.checked);
                    }}
                  />
                  <label
                    htmlFor="displayImage"
                    className={`flex items-center cursor-pointer transition-all duration-300 ${
                      displayImage
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                        : "bg-white/20"
                    } w-14 h-8 rounded-full p-1 shadow-lg backdrop-blur-md border border-white/30`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                        displayImage
                          ? "translate-x-6 shadow-cyan-400/50"
                          : "translate-x-0"
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>

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
              <label
                htmlFor="amount"
                className="text-white text-sm font-medium"
              >
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

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-col">
                  <label
                    htmlFor="showSecondHalf"
                    className="text-white text-base font-medium cursor-pointer"
                  >
                    Zweite Hälfte anzeigen
                  </label>
                  <span className="text-white/70 text-sm">
                    Aktiviere einen zusätzlichen Zielbetrag
                  </span>
                </div>

                {/* Custom Toggle Switch */}
                <div className="relative">
                  <input
                    id="showSecondHalf"
                    type="checkbox"
                    name="showSecondHalf"
                    className="sr-only"
                    checked={showSecondHalf}
                    onChange={(e) => {
                      setShowSecondHalf(e.target.checked);
                    }}
                  />
                  <label
                    htmlFor="showSecondHalf"
                    className={`flex items-center cursor-pointer transition-all duration-300 ${
                      showSecondHalf
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                        : "bg-white/20"
                    } w-14 h-8 rounded-full p-1 shadow-lg backdrop-blur-md border border-white/30`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                        showSecondHalf
                          ? "translate-x-6 shadow-cyan-400/50"
                          : "translate-x-0"
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showSecondHalf ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-2 pt-2">
                <label
                  htmlFor="secondHalfAmount"
                  className="text-white text-sm font-medium flex items-center gap-2"
                >
                  <span className="text-cyan-400">🎯</span>
                  Zusätzliches Ziel (€)
                </label>
                <input
                  id="secondHalfAmount"
                  type="number"
                  name="secondHalfAmount"
                  step="0.01"
                  defaultValue={secondHalfAmount}
                  min="0"
                  placeholder="Zusätzlicher Betrag..."
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-md border border-cyan-400/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 focus:bg-cyan-500/20 transition-all duration-200 shadow-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer ${
                isLoading
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                  : showSuccess
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105 focus:ring-green-400"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 focus:ring-cyan-400"
              } text-white`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Speichere...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Erfolgreich gespeichert! ✅
                </span>
              ) : (
                "Goal setzen 🎯"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/70 text-sm">
              Setze dein Ko-Fi Spendenziel und verfolge den Fortschritt!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
