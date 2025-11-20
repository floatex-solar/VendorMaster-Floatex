import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useSearch({ keyword, categoryId, subCategoryId }) {
  return useQuery({
    queryKey: ["search", keyword, categoryId, subCategoryId],
    queryFn: async () => {
      const res = await api.get("/search/items", {
        params: { q: keyword, categoryId, subCategoryId },
      });
      return res.data;
    },
    enabled: Boolean(keyword || categoryId || subCategoryId),
  });
}
