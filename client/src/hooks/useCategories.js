// src/hooks/useCategories.js (fully updated)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// ---------------------------
// GET ALL CATEGORIES
// ---------------------------
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data; // array of { categoryId, name, ... }
    },
    staleTime: 10000,
  });
}

// ---------------------------
// GET ALL SUBCATEGORIES
// ---------------------------
export function useSubCategories() {
  return useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await api.get("/subcategories");
      return res.data; // array of { subCategoryId, categoryId, name, ... }
    },
    staleTime: 10000,
  });
}

// ---------------------------
// CREATE CATEGORY
// ---------------------------
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/categories", payload);
      return res.data; // IMPORTANT: return created category object
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ---------------------------
// CREATE SUBCATEGORY
// ---------------------------
export function useCreateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/subcategories", payload);
      return res.data; // IMPORTANT: return created subcategory object
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategories"] }),
  });
}

// ---------------------------
// UPDATE CATEGORY
// ---------------------------
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/categories/${id}`, payload);
      return res.data; // return updated category
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ---------------------------
// DELETE CATEGORY
// ---------------------------
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/categories/${id}`);
      return res.data; // return delete response
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ---------------------------
// UPDATE SUBCATEGORY
// ---------------------------
export function useUpdateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/subcategories/${id}`, payload);
      return res.data; // updated subcategory object
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategories"] }),
  });
}

// ---------------------------
// DELETE SUBCATEGORY
// ---------------------------
export function useDeleteSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/subcategories/${id}`);
      return res.data; // delete response
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategories"] }),
  });
}
