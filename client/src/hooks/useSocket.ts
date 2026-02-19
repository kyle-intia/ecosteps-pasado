import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import useAuth from "./useAuth";

let socket: Socket | null = null;

export function useSocket(onNotification?: (data: any) => void) {
  const { user } = useAuth() as { user: { _id?: string } };

  useEffect(() => {
    if (!user?._id) return;

    if (!socket || !socket.connected) {
      socket = io(import.meta.env.VITE_API_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });
    }

    const s = socket;

    s.on("connect", () => {
      s.emit("joinRoom", user._id);
    });

    if (onNotification) {
      s.on("notification", onNotification);
    }

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
