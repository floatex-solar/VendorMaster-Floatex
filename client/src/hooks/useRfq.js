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
