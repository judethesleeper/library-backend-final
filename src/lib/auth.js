import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "myjwtsecret";

export function getUserFromRequest(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) return null;

    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function requireAuth(req) {
  return getUserFromRequest(req);
}

export function requireAdmin(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export function requireRole(req, role) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== role) return null;
  return user;
}