import * as vendorService from "../services/vendor.service.js";

export async function list(req, res, next) {
  try {
    res.json(await vendorService.listVendors());
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  console.log(req.body);
  try {
    const vendorId = await vendorService.createVendor(req.body.vendor);

    // Add Contacts (batch operation)
    if (req.body.contacts?.length > 0) {
      await vendorService.addContacts(vendorId, req.body.contacts);
    }

    // Add Item Mappings (batch operation)
    if (req.body.mappings?.length > 0) {
      await vendorService.addMappings(vendorId, req.body.mappings);
    }

    res.status(201).json({ vendorId });
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const vendor = await vendorService.getVendor(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const contacts = await vendorService.listContacts(req.params.id);
    const mappings = await vendorService.listMappings(req.params.id);

    res.json({ vendor, contacts, mappings });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const vendorId = req.params.id;

    // Update vendor core data
    await vendorService.updateVendor(vendorId, req.body.vendor);

    // CONTACTS
    if (req.body.contacts) {
      for (const c of req.body.contacts) {
        if (c._action === "add") {
          await vendorService.addContact(vendorId, c);
        } else if (c._action === "update") {
          await vendorService.updateContact(c.contactId, c);
        } else if (c._action === "delete") {
          await vendorService.deleteContact(c.contactId);
        }
      }
    }

    // MAPPINGS
    if (req.body.mappings) {
      for (const m of req.body.mappings) {
        if (m._action === "add") {
          await vendorService.addMapping(vendorId, m);
        } else if (m._action === "update") {
          await vendorService.updateMapping(m.mappingId, m);
        } else if (m._action === "delete") {
          await vendorService.deleteMapping(m.mappingId);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await vendorService.deleteVendor(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
