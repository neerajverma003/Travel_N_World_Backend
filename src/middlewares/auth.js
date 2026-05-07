import jwt from "jsonwebtoken";
import { ROLES } from "../utils/constant.js";

// Authenticate and attach user to req
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader.startsWith("bearer ") 
      ? authHeader.slice(7) 
      : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
 
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role, 
    };

    next();
  } catch (error) {
    console.error("JWT Verify Error:", error); 
    const message = error.name === "TokenExpiredError"
      ? "Unauthorized: Token expired"
      : `Unauthorized: ${error.message}`;

    return res.status(401).json({ message });
  }
}

// Role hierarchy control (Super Admin > Admin > Agent)
const roleHierarchy = {
  [ROLES.SUPERADMIN]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.AGENT]: 1,
};

// Allow only specific roles OR higher ones in hierarchy
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
    }

    const userRole = req.user.role;

    if (!userRole || !roleHierarchy[userRole]) {
      return res.status(403).json({
        message: "Forbidden: Invalid or missing role",
      });
    }

    // If user’s role rank >= any allowed role’s rank, grant access
    const userRank = roleHierarchy[userRole];
    const allowedRanks = allowedRoles.map((r) => roleHierarchy[r]);

    const hasAccess = allowedRanks.some((rank) => userRank >= rank);

    if (!hasAccess) {
      return res.status(403).json({
        message: `Forbidden: Requires role(s): ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

export const Roles = ROLES;
