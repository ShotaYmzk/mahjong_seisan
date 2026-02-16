"use client";

import { useRouter } from "next/navigation";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { useRecentRooms } from "@/hooks/useRecentRooms";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const { recentRooms } = useRecentRooms();

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Theme toggle - fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm pt-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-jade-surface border border-jade/20 mb-5 shadow-[0_4px_24px_var(--c-jade-glow)]">
            <span className="text-4xl">🀄</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary">
            麻雀精算
          </h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            対局の精算をリアルタイムで共同編集
          </p>
        </div>

        {/* Create Room */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            グループを作成
          </h2>
          <CreateRoomForm />
        </Card>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <svg
                className="w-4 h-4 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-sm font-semibold text-text-secondary">
                最近のルーム
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {recentRooms.map((room) => (
                <Card
                  key={room.roomId}
                  hover
                  onClick={() => router.push(`/rooms/${room.roomId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">
                        {room.roomName}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(room.lastVisited).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-text-muted shrink-0 ml-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
