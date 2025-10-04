import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from './useSessions';

const useSessionStatus = () => {
  const { sessions, isPending, isError } = useSessions();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPending) return;

    if (sessions.length > 0) {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
    } else {
      localStorage.removeItem("isLoggedIn");
      navigate("/", { replace: true });
    }

  }, [isPending, isError, sessions, navigate]);

  return { isPending, isLoggedIn };
};



export default useSessionStatus;
