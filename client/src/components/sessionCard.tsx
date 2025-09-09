import React from "react";
import useDeleteSession from "../hooks/useDeleteSession";

// Define the type for the session prop
interface Session {
  _id: string;
  createdAt: string;
  userAgent: string;
  isCurrent: boolean;
}

interface SessionCardProps {
  session: Session;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const { _id, createdAt, userAgent, isCurrent } = session;
  const { deleteSession, isPending } = useDeleteSession(_id);

  return (
    <div style={styles.card}>
      <div style={styles.content}>
        <div style={styles.date}>
          <strong>{new Date(createdAt).toLocaleString("en-US")}</strong>
          {isCurrent && " (current session)"}
        </div>
        <div style={styles.userAgent}>{userAgent}</div>
      </div>
      {!isCurrent && (
        <button
          onClick={deleteSession}
          disabled={isPending}
          title="Delete Session"
          style={styles.deleteButton}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default SessionCard;

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    display: "flex",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    marginBottom: "10px",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  date: {
    fontSize: "14px",
    marginBottom: "4px",
  },
  userAgent: {
    fontSize: "12px",
    color: "#666",
  },
  deleteButton: {
    marginLeft: "16px",
    fontSize: "20px",
    backgroundColor: "transparent",
    border: "none",
    color: "#e53e3e",
    cursor: "pointer",
    alignSelf: "center",
  },
};
