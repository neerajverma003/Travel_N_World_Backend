/**
 * Transport Route Controller
 * CRUD for TransportRoute — SuperAdmin/Admin only (create/update/delete)
 * Public: list & get by slug
 */

import { TransportRoute } from "../models/TransportRoute.js";
import { AppError } from "../utils/errorHandler.js";
import Agent from "../models/agent.js";

/* ── helpers ──────────────────────────────────────────────── */
const getCreatorInfo = (user) => {
  if (!user) throw new AppError("Not authenticated", 401);
  const model =
    user.role === "SUPERADMIN" || user.role === "ADMIN"
      ? "AdminLoginCredential"
      : "Agent";
  return { createdBy: user.id, creatorModel: model };
};

/* ── PUBLIC: list all published transport routes ──────────── */
export const listTransportRoutes = async (req, res, next) => {
  try {
    const { agentId, type, page = 1, limit = 50 } = req.query;
    const query = { isPublished: true };
    if (agentId) query.agentId = agentId;
    if (type) query.type = type.toLowerCase();

    const routes = await TransportRoute.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("agentId", "company firstName lastName slug photo");

    const total = await TransportRoute.countDocuments(query);
    res.json({ success: true, data: routes, total });
  } catch (err) {
    next(err);
  }
};

/* ── PUBLIC: get single route by slug ─────────────────────── */
export const getTransportRouteBySlug = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({ slug: req.params.slug }).populate(
      "agentId",
      "company firstName lastName slug photo phone whatsapp companyAddress"
    );
    if (!route) throw new AppError("Transport route not found", 404);
    res.json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

/* ── ADMIN: list ALL (including drafts) ────────────────────── */
export const adminListTransportRoutes = async (req, res, next) => {
  try {
    const { agentId, type, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (agentId) query.agentId = agentId;
    if (type) query.type = type.toLowerCase();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    const routes = await TransportRoute.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("agentId", "company firstName lastName");

    const total = await TransportRoute.countDocuments(query);
    res.json({ success: true, data: routes, total });
  } catch (err) {
    next(err);
  }
};

/* ── ADMIN: create ─────────────────────────────────────────── */
export const createTransportRoute = async (req, res, next) => {
  try {
    const { createdBy, creatorModel } = getCreatorInfo(req.user);
    const {
      title, destination, type,
      vehicleType, serviceType,
      asBestQuote, pricePerKm, fixedPrice, discountedPrice,
      shortDescription, gallery, coverImageUrl,
      themes, classification, visibility,
      termsConditions, paymentMode, cancellationPolicy,
      agentId, isPublished,
    } = req.body;

    if (!title) throw new AppError("Title is required", 400);
    if (!destination) throw new AppError("Destination is required", 400);

    const route = new TransportRoute({
      title, destination,
      type: type || "domestic",
      vehicleType, serviceType,
      asBestQuote: Boolean(asBestQuote),
      pricePerKm: asBestQuote ? 0 : Number(pricePerKm) || 0,
      fixedPrice: asBestQuote ? 0 : Number(fixedPrice) || 0,
      discountedPrice: asBestQuote ? 0 : Number(discountedPrice) || 0,
      shortDescription,
      coverImageUrl,
      gallery: Array.isArray(gallery) ? gallery : [],
      themes: Array.isArray(themes) ? themes : [],
      classification: Array.isArray(classification) ? classification : [],
      visibility: visibility || "Public",
      termsConditions, paymentMode, cancellationPolicy,
      agentId: agentId || undefined,
      isPublished: isPublished !== false,
      createdBy, creatorModel,
    });

    await route.save();
    res.status(201).json({ success: true, message: "Transport route created", data: route });
  } catch (err) {
    next(err);
  }
};

/* ── ADMIN: update ─────────────────────────────────────────── */
export const updateTransportRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({ slug: req.params.slug });
    if (!route) throw new AppError("Transport route not found", 404);

    const forbidden = ["_id", "id", "__v", "createdBy", "creatorModel", "createdAt", "updatedAt"];
    forbidden.forEach((f) => delete req.body[f]);

    if (req.body.asBestQuote) {
      req.body.fixedPrice = 0;
      req.body.discountedPrice = 0;
    }

    Object.assign(route, req.body);
    await route.save();
    res.json({ success: true, message: "Transport route updated", data: route });
  } catch (err) {
    next(err);
  }
};

/* ── ADMIN: delete ─────────────────────────────────────────── */
export const deleteTransportRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOneAndDelete({ slug: req.params.slug });
    if (!route) throw new AppError("Transport route not found", 404);
    res.json({ success: true, message: "Transport route deleted" });
  } catch (err) {
    next(err);
  }
};
