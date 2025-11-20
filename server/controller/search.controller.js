import * as searchService from "../services/search.service.js";

export async function search(req, res, next) {
  try {
    const keyword = req.query.q || "";
    const categoryId = req.query.categoryId || "";
    const subCategoryId = req.query.subCategoryId || "";

    const data = await searchService.searchItemVendors({
      keyword,
      categoryId,
      subCategoryId,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}
