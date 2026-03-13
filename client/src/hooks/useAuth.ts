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
    try {
      const res = await authApi.register(data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success("Account created successfully!");
      navigate(getRoleHome(res.user.role));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(getRoleHome(res.user.role));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // silently fail — clear locally regardless
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