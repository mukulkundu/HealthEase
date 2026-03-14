import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: "PATIENT" | "DOCTOR";
  }) => {
    setLoading(true);
    let user: { role: Role } | null = null;
    try {
      const response = await authApi.register(data);
      const u = response?.data?.user;
      if (u) {
        setAuth(u);
        user = u;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
    if (user) {
      toast.success("Account created successfully!");
      navigate(getRoleHome(user.role));
    }
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    let user: { name?: string; role: Role } | null = null;
    try {
      const response = await authApi.login(data);
      const u = response?.data?.user;
      if (u) {
        setAuth(u);
        user = u;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Invalid email or password");
    } finally {
      setLoading(false);
    }
    if (user) {
      toast.success(`Welcome back, ${user.name ?? "User"}!`);
      navigate(getRoleHome(user.role));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // clear locally regardless
    } finally {
      clearAuth();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  return { login, register, logout, loading };
}

function getRoleHome(role: Role): string {
  switch (role) {
    case "DOCTOR": return "/doctor/dashboard";
    case "ADMIN": return "/admin";
    default: return "/dashboard";
  }
}
