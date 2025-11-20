// server/controllers/pinned.controller.js
import * as pinnedService from "../services/pinned.service.js";

export async function listPins(req, res, next) {
  try {
    const pins = await pinnedService.getAllPins();
    res.json(pins);
  } catch (err) {
    next(err);
  }
}

export async function createPin(req, res, next) {
  try {
    const { itemId, itemDescription, searchTerm } = req.body;
    if (!itemId) return res.status(400).json({ error: "itemId is required" });
    const pin = await pinnedService.createPin({
      itemId,
      itemDescription,
      searchTerm,
    });
    res.status(201).json(pin);
  } catch (err) {
    next(err);
  }
}

export async function deletePin(req, res, next) {
  try {
    const { id } = req.params;
    await pinnedService.deletePin(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
