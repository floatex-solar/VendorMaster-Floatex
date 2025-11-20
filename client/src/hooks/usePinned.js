// src/hooks/usePinned.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export function usePinned() {
  return useQuery({
    queryKey: ["pinned"],
    queryFn: async () => {
      const res = await api.get("/pinned");
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useCreatePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/pinned", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pinned"] }),
  });
}

export function useDeletePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/pinned/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pinned"] }),
  });
}
