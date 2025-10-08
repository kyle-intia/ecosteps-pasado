import React, { useEffect, useState } from "react";
import useSessions from "../hooks/useSessions";
import SessionCard from "../components/sessionCard";
import { useNavigate } from "react-router-dom";

const Settings: React.FC = () => {
  const { sessions, isPending, isSuccess, isError } = useSessions();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const loggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!loggedIn) {
    navigate("/");
    return;
  }
  setIsLoggedIn(true);
}, []);


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div style={styles.container}>
        <h1 style={styles.heading}>My Sessions</h1>

        {isPending && <div style={styles.spinner}>Loading...</div>}

        {isError && (
          <p style={{ ...styles.message, color: "red" }}>
            Failed to get sessions.
          </p>
        )}

        {isSuccess && (
          <div style={styles.sessionList}>
            {sessions.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "4rem 1rem 0 1rem",
  },
  heading: {
    marginBottom: "1.5rem",
    fontSize: "2rem",
  },
  spinner: {
    fontSize: "1rem",
    color: "#666",
  },
  message: {
    fontSize: "1rem",
    marginBottom: "1rem",
  },
  sessionList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-start",
  },
};
