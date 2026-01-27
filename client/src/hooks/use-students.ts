import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useStudentsWithStatus() {
  return useQuery({
    queryKey: [api.students.listWithStatus.path],
    queryFn: async () => {
      const res = await fetch(api.students.listWithStatus.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.students.listWithStatus.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh status every 30s
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; indexNumber: string }) => {
      const res = await fetch(api.students.create.path, {
        method: api.students.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create student");
      }
      return api.students.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.students.listWithStatus.path] }),
  });
}
