"use client";

import { useEffect, useState, useCallback } from "react";

export type RecentRoom = {
  roomId: string;
  roomName: string;
  lastVisited: string;
};

const STORAGE_KEY = "mahjong_recent_rooms";
const MAX_ROOMS = 5;

function readFromStorage(): RecentRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentRoom[];
  } catch {
    return [];
  }
}

function writeToStorage(rooms: RecentRoom[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function useRecentRooms() {
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    setRecentRooms(readFromStorage());
  }, []);

  const addRecentRoom = useCallback((roomId: string, roomName: string) => {
    const current = readFromStorage();
    const filtered = current.filter((r) => r.roomId !== roomId);
    const updated: RecentRoom[] = [
      { roomId, roomName, lastVisited: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_ROOMS);
    writeToStorage(updated);
    setRecentRooms(updated);
  }, []);

  return { recentRooms, addRecentRoom };
}
