// src/hooks/useSocket.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import useAuth from "./useAuth";

let socket: Socket | null = null;

export function useSocket(onNotification?: (data: any) => void) {
  const { user } = useAuth() as { user: { _id?: string } };

  useEffect(() => {
    if (!user?._id) return;

    if (!socket || !socket.connected) {
      socket = io("http://localhost:4004", {
        withCredentials: true,
        transports: ["websocket"], // ← Force WebSocket (no polling delay!)
      });
    }

    const s = socket;

    s.on("connect", () => {
      console.log("Socket connected:", s.id);

      // THIS IS THE KEY LINE YOU WERE MISSING:
      s.emit("joinRoom", user._id);
      console.log("Joined room:", user._id);
    });

    if (onNotification) {
      s.on("notification", onNotification);
    }

    // Optional: handle reconnects
    s.on("reconnect", () => {
      s.emit("joinRoom", user._id);
    });

    return () => {
      if (onNotification) {
        s.off("notification", onNotification);
      }
    };
  }, [user?._id, onNotification]);

  return socket;
}