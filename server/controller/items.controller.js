// Backend: src/controller/items.controller.js (updated)
import * as itemService from "../services/items.service.js";

export async function list(req, res, next) {
  try {
    res.json(await itemService.listItems());
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    res.json(await itemService.createItem(req.body));
  } catch (err) {
    next(err);
  }
}

export async function bulkCreate(req, res, next) {
  try {
    await itemService.bulkCreate(req.body.items);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    await itemService.updateItem(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await itemService.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function bulkRemove(req, res, next) {
  try {
    const { ids } = req.body;
    console.log("I was called");
    await itemService.bulkDelete(ids);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
