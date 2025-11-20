// controllers/uom.controller.js
import * as uomService from "../services/uom.service.js";

export async function getAll(req, res, next) {
  try {
    res.json(await uomService.getAllUoms());
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    res.json(await uomService.createUom(req.body));
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    res.json(await uomService.updateUom(id, req.body));
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    res.json(await uomService.deleteUom(id));
  } catch (e) {
    next(e);
  }
}
