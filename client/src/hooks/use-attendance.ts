import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type MarkAttendanceInput = z.infer<typeof api.attendance.mark.input>;

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MarkAttendanceInput) => {
      const res = await fetch(api.attendance.mark.path, {
        method: api.attendance.mark.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to mark attendance");
      }
      return api.attendance.mark.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.attendance.history.path] }),
  });
}

export function useAttendanceHistory() {
  return useQuery({
    queryKey: [api.attendance.history.path],
    queryFn: async () => {
      const res = await fetch(api.attendance.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.attendance.history.responses[200].parse(await res.json());
    },
  });
}

export function useSessionReport(sessionId: number | null) {
  return useQuery({
    queryKey: [api.attendance.report.path, sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return [];
      const url = buildUrl(api.attendance.report.path, { sessionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return api.attendance.report.responses[200].parse(await res.json());
    },
  });
}
