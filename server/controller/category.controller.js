import * as categoryService from "../services/category.service.js";

export async function list(req, res, next) {
  try {
    const data = await categoryService.listCategories();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name } = req.body;
    const data = await categoryService.createCategory(name);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, active } = req.body;
    await categoryService.updateCategory(id, name, active);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
