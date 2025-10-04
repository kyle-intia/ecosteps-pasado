import { useMutation } from "@tanstack/react-query";
import { logout } from "../lib/api";
import queryClient from "../config/queryClient";
import { useNavigate } from "react-router-dom";

const useSignOut = () => {
  const navigate = useNavigate();

  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      localStorage.clear();
      queryClient.clear(); 
      navigate("/login", { replace: true }); 
    },
  });

  return { signOut };
};

export default useSignOut;
