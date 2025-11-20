import * as authService from "../services/auth.service.js";

export async function login(req, res) {
  try {
    const data = await authService.login(
      req.body.email || req.body.username,
      req.body.password
    );
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { token } = await authService.forgotPassword(req.body.email);
    res.json({ success: true, resetToken: token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
