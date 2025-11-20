// src/hooks/useAuth.js
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ emailOrUsername, password }) => {
      const res = await api.post("/auth/login", {
        email: emailOrUsername,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      return res.data;
    },

    onSuccess: () => {
      toast.success("Login successful!");
      navigate("/items", { replace: true });
    },

    onError: (err) => {
      toast.error(err?.response?.data?.error || "Invalid credentials");
    },
  });
}
