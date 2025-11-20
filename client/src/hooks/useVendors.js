import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// GET ALL VENDORS
export function useVendors({ q = "" } = {}) {
  return useQuery({
    queryKey: ["vendors", q],
    queryFn: async () => {
      const res = await api.get("/vendors", { params: { q } });
      // Expect array of vendor rows like [{ vendorId, name, address, state, city, pinCode, gst, phone, email, createdAt, updatedAt, active }]
      return res.data;
    },
    staleTime: 5000,
  });
}

// GET ONE VENDOR (with contacts and mappings)
export function useVendor(vendorId) {
  return useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const res = await api.get(`/vendors/${vendorId}`);
      return res.data; // { vendor, contacts, mappings }
    },
    enabled: !!vendorId,
  });
}

// CREATE / UPDATE / DELETE / BULK endpoints left as in your original file
export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/vendors", payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useBulkCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vendorsArray) => {
      const results = [];
      for (const vData of vendorsArray) {
        const res = await api.post("/vendors", vData);
        results.push(res.data);
      }
      return results;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/vendors/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["vendor"] });
    },
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/vendors/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useBulkDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const results = [];
      for (const id of ids) {
        const res = await api.delete(`/vendors/${id}`);
        results.push(res.data);
      }
      return results;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}
