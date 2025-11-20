// src/hooks/useUoms.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export function useUoms() {
  return useQuery({
    queryKey: ["uoms"],
    queryFn: async () => {
      const res = await api.get("/uoms");
      return res.data; // array of UOMs
    },
  });
}

export function useCreateUom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/uoms", payload);
      return res.data; // <-- return actual UOM object
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uoms"] }),
  });
}

export function useUpdateUom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/uoms/${id}`, payload);
      return res.data; // <-- return updated UOM
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uoms"] }),
  });
}

export function useDeleteUom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/uoms/${id}`);
      return res.data; // <-- return delete success response (if any)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uoms"] }),
  });
}
