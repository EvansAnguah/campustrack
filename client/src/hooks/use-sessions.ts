import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateSessionInput = z.infer<typeof api.sessions.create.input>;

export function useActiveSessions() {
  return useQuery({
    queryKey: [api.sessions.listActive.path],
    queryFn: async () => {
      const res = await fetch(api.sessions.listActive.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      return api.sessions.listActive.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Refresh every 10s
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      const res = await fetch(api.sessions.create.path, {
        method: api.sessions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start session");
      return api.sessions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.sessions.listActive.path] }),
  });
}

export function useStopSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.sessions.stop.path, { id });
      const res = await fetch(url, {
        method: api.sessions.stop.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to stop session");
      return api.sessions.stop.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.sessions.listActive.path] }),
  });
}

export function useSessionReport(sessionId: number) {
  return useQuery({
    queryKey: [api.attendance.report.path, sessionId],
    queryFn: async () => {
      const url = buildUrl(api.attendance.report.path, { sessionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return api.attendance.report.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
    refetchInterval: 5000,
  });
}
