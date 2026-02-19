import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout } from "../lib/api";

interface UserMenuProps {}

const UserMenu: React.FC<UserMenuProps> = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="relative inline-block">
      <button className="absolute left-6 bottom-6 border-none bg-none cursor-pointer">
        <img src="#" alt="User Avatar" className="rounded-full w-10 h-10" />
      </button>
      <ul className="absolute right-0 bg-white border border-gray-300 shadow-lg p-4 mt-2 w-48 list-none hidden">
        <li
          className="py-2 cursor-pointer hover:bg-gray-200"
          onClick={() => navigate("/profile")}
        >
          Profile
        </li>
        <li
          className="py-2 cursor-pointer hover:bg-gray-200"
          onClick={() => navigate("/settings")}
        >
          Settings
        </li>
        <li
          className="py-2 cursor-pointer hover:bg-gray-200"
          onClick={() => signOut()}
        >
          Logout
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;
