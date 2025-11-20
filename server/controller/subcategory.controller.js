import * as subService from "../services/subcategory.service.js";

export async function list(req, res, next) {
  try {
    res.json(await subService.listSubCategories());
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { categoryId, name } = req.body;
    res.json(await subService.createSubCategory(categoryId, name));
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, categoryId, active } = req.body;
    await subService.updateSubCategory(id, name, categoryId, active);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await subService.deleteSubCategory(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
