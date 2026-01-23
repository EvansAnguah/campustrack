import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest, type OnboardRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface AuthContextType {
  user: any; // Polymorphic user
  role: "student" | "lecturer" | null;
  isLoading: boolean;
  deviceId: string;
  login: (data: Omit<LoginRequest, "deviceId">) => Promise<void>;
  logout: () => Promise<void>;
  onboard: (data: Omit<OnboardRequest, "deviceId">) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    let storedId = localStorage.getItem("device_id");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("device_id", storedId);
    }
    setDeviceId(storedId);
  }, []);

  const { data: authData, isLoading } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: Omit<LoginRequest, "deviceId">) => {
      if (!deviceId) throw new Error("Initializing device...");
      const payload = { ...data, deviceId };
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 409) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Login failed");
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], { user: data.user, role: data.role });
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      toast({ title: "Logged out" });
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: Omit<OnboardRequest, "deviceId">) => {
      if (!deviceId) throw new Error("Initializing device...");
      const payload = { ...data, deviceId };
      const res = await fetch(api.auth.onboard.path, {
        method: api.auth.onboard.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Onboarding failed");
      }
      return api.auth.onboard.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Registered!", description: "You can now login with your new password." });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: authData?.user,
        role: authData?.role ?? null,
        isLoading,
        deviceId,
        login: async (data) => await loginMutation.mutateAsync(data),
        logout: async () => await logoutMutation.mutateAsync(),
        onboard: async (data) => await onboardMutation.mutateAsync(data),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
