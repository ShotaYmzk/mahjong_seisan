"use client";

import { useState } from "react";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";

export default function Home() {
  const [mode, setMode] = useState<"create" | "join">("create");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🀄</div>
          <h1 className="text-2xl font-bold text-text-primary">麻雀精算</h1>
          <p className="text-sm text-text-secondary mt-1">
            セッションの精算をみんなで共同編集
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-bg-secondary border border-border-primary p-1 mb-6">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "create"
                ? "bg-jade text-bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            部屋を作る
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "join"
                ? "bg-jade text-bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            参加する
          </button>
        </div>

        {/* Form */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5">
          {mode === "create" ? <CreateRoomForm /> : <JoinRoomForm />}
        </div>
      </div>
    </main>
  );
}
