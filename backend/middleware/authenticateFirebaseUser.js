import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";

export async function authenticateFirebaseUser(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ success: false, message: "Firebase ID token is required." });
    }

    const decodedToken = await verifyFirebaseIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase authentication failed:", error);
    res.status(401).json({ success: false, message: "Your session could not be verified." });
  }
}

export function requireCronSecret(req, res, next) {
  const expectedSecret = process.env.NOTIFICATION_CRON_SECRET;
  if (!expectedSecret) return next();

  const providedSecret = req.headers["x-cron-secret"] || req.query.secret;
  if (providedSecret !== expectedSecret) {
    return res.status(403).json({ success: false, message: "Notification processor secret is invalid." });
  }

  next();
}
