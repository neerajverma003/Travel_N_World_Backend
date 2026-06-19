import Agent from "../models/agent.js";
import User from "../models/User.js";
import { Itinerary } from "../models/Itinerary.js";
import { Enquiry } from "../models/enquiry.js";
import AdminLoginCredential from "../models/adminLoginCredential.js";
import { ROLES } from "../utils/constant.js";

export const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === ROLES.RM) {
      // Stats for Relationship Manager
      const myAgents = await Agent.find({ relationshipManagerId: userId }).select("_id agentCategory");
      const agentIds = myAgents.map(a => a._id);
      const travelAgentIds = myAgents.filter(a => a.agentCategory !== "Transport").map(a => a._id);
      const transportAgentIds = myAgents.filter(a => a.agentCategory === "Transport").map(a => a._id);

      const [
        totalAgents,
        totalTransport,
        totalEnquiries,
        latestEnquiries,
        latestAgents
      ] = await Promise.all([
        Agent.countDocuments({ relationshipManagerId: userId, role: ROLES.AGENT, agentCategory: { $ne: "Transport" } }),
        Agent.countDocuments({ relationshipManagerId: userId, role: ROLES.AGENT, agentCategory: "Transport" }),
        Enquiry.countDocuments({ agentId: { $in: agentIds } }),
        Enquiry.find({ agentId: { $in: agentIds } }).sort({ createdAt: -1 }).limit(10),
        Agent.find({ relationshipManagerId: userId, role: ROLES.AGENT }).sort({ createdAt: -1 }).limit(10)
      ]);

      const activities = [
        ...latestEnquiries.map(e => ({
          activity: `New Lead for assigned Agent: ${e.name}`,
          user: e.email,
          time: e.createdAt,
          status: "Success"
        })),
        ...latestAgents.map(a => ({
          activity: `New ${a.agentCategory || "Travel"} Agent Onboarded: ${a.company || a.firstName}`,
          user: a.email,
          time: a.createdAt,
          status: "Success"
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

      return res.status(200).json({
        success: true,
        data: {
          totalAgents,
          totalTransport,
          totalAdmins: 0,
          totalItineraries: 0,
          totalEnquiries,
          activities,
          successRate: "99%"
        }
      });
    }

    if (userRole === ROLES.AGENT) {
      // Stats for Agent
      const targetAgentId = req.user.parentId || userId;
      const [
        totalItineraries,
        totalTransportRoutes,
        totalEnquiries,
        latestEnquiries
      ] = await Promise.all([
        import("../models/AgentItinerary.js").then(m => m.AgentItinerary.countDocuments({ agentId: targetAgentId })),
        import("../models/TransportRoute.js").then(m => m.TransportRoute.countDocuments({ agentId: targetAgentId })),
        Enquiry.countDocuments({ agentId: targetAgentId }),
        Enquiry.find({ agentId: targetAgentId }).sort({ createdAt: -1 }).limit(20)
      ]);

      const activities = latestEnquiries.map(e => ({
        activity: e.itineraryTitle ? `Enquiry for ${e.itineraryTitle}` : `New Lead from ${e.name}`,
        user: e.email,
        time: e.createdAt,
        status: "Success"
      }));

      return res.status(200).json({
        success: true,
        data: {
          totalAgents: 0,
          totalAdmins: 0,
          totalItineraries: totalItineraries + totalTransportRoutes,
          totalEnquiries,
          activities,
          successRate: "99%"
        }
      });
    }

    // Default Stats for Superadmin
    const [
      totalAgents,
      totalTransport,
      totalAdmins,
      totalItineraries,
      totalEnquiries,
      latestEnquiries,
      latestAgents
    ] = await Promise.all([
      Agent.countDocuments({ role: ROLES.AGENT, agentCategory: { $ne: "Transport" } }),
      Agent.countDocuments({ role: ROLES.AGENT, agentCategory: "Transport" }),
      AdminLoginCredential.countDocuments({ role: { $in: [ROLES.SUPERADMIN, ROLES.ADMIN] } }),
      Itinerary.countDocuments(),
      Enquiry.countDocuments(),
      Enquiry.find().sort({ createdAt: -1 }).limit(10),
      Agent.find({ role: ROLES.AGENT }).sort({ createdAt: -1 }).limit(10)
    ]);

    const activities = [
      ...latestEnquiries.map(e => ({
        activity: `New Enquiry from ${e.name}`,
        user: e.email,
        time: e.createdAt,
        status: "Success"
      })),
      ...latestAgents.map(a => ({
        activity: `New ${a.agentCategory || "Travel"} partner registered: ${a.company || a.firstName}`,
        user: a.email,
        time: a.createdAt,
        status: "Success"
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

    const superadmin = await AdminLoginCredential.findById(userId);
    const notificationsEnabled = superadmin ? superadmin.notificationsEnabled : true;

    res.status(200).json({
      success: true,
      data: {
        totalAgents,
        totalTransport,
        totalAdmins,
        totalItineraries,
        totalEnquiries,
        activities,
        successRate: "99%",
        notificationsEnabled
      }
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
