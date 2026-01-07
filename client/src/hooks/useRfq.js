// src/hooks/useRfq.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

/* -----------------------------------------
   CREATE RFQ (single vendor)
----------------------------------------- */
export function useCreateRfq() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/rfqs", payload);
      return res.data; // { success, rfqNo, pdfUrl }
    },
    onSuccess: () => {
      // Later this will refresh RFQ list/history
      qc.invalidateQueries({ queryKey: ["rfqs"] });
    },
  });
}

/* -----------------------------------------
   GET ALL RFQs (future use)
----------------------------------------- */
export function useRfqs() {
  return useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const res = await api.get("/rfqs");
      return res.data;
    },
    staleTime: 5000,
  });
}

/* -----------------------------------------
   GET RFQ TEMPLATES
----------------------------------------- */
export function useRfqTemplates(enabled = true) {
  return useQuery({
    queryKey: ["rfqTemplates"],
    queryFn: async () => {
      const res = await api.get("/rfqs/templates");
      return res.data; // { email, whatsapp }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/* -----------------------------------------
   SAVE RFQ TEMPLATE
----------------------------------------- */
export function useSaveRfqTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, content }) => {
      const res = await api.post("/rfqs/templates", { type, content });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rfqTemplates"] });
    },
  });
}
