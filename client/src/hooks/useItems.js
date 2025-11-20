// src/hooks/useItems.js (fully updated)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// -----------------------------------------
// GET ALL ITEMS (with optional search)
// -----------------------------------------
export function useItems({ q = "" } = {}) {
  return useQuery({
    queryKey: ["items", q],
    queryFn: async () => {
      const res = await api.get("/items", { params: { q } });
      return res.data; // array of items
    },
    staleTime: 5000,
  });
}

// -----------------------------------------
// GET ONE ITEM
// -----------------------------------------
export function useItem(itemId) {
  return useQuery({
    queryKey: ["item", itemId],
    queryFn: async () => {
      const res = await api.get(`/items/${itemId}`);
      return res.data; // single item
    },
    enabled: !!itemId,
  });
}

// -----------------------------------------
// CREATE ONE ITEM
// -----------------------------------------
export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/items", payload);
      return res.data; // created item object
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

// -----------------------------------------
// BULK CREATE ITEMS
// -----------------------------------------
export function useBulkCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items) => {
      const res = await api.post("/items/bulk", { items });
      return res.data; // array of created items
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

// -----------------------------------------
// UPDATE ITEM
// -----------------------------------------
export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/items/${id}`, payload);
      return res.data; // updated item
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
    },
  });
}

// -----------------------------------------
// DELETE ONE ITEM
// -----------------------------------------
export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/items/${id}`);
      return res.data; // delete confirmation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

// -----------------------------------------
// BULK DELETE ITEMS
// -----------------------------------------
export function useBulkDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const res = await api.delete("/items/bulk", { data: { ids } });
      return res.data; // bulk delete confirmation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}
