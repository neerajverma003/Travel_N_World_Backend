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

    if (userRole === ROLES.AGENT) {
      // Stats for Agent
      const [
        totalItineraries,
        totalEnquiries,
        latestEnquiries
      ] = await Promise.all([
        import("../models/AgentItinerary.js").then(m => m.AgentItinerary.countDocuments({ agentId: userId })),
        Enquiry.countDocuments({ agentId: userId }),
        Enquiry.find({ agentId: userId }).sort({ createdAt: -1 }).limit(5)
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
          totalAgents: 0, // Not relevant for agent
          totalAdmins: 0, // Not relevant for agent
          totalItineraries,
          totalEnquiries,
          activities,
          successRate: "99%"
        }
      });
    }

    // Default Stats for Superadmin
    const [
      totalAgents,
      totalAdmins,
      totalItineraries,
      totalEnquiries,
      latestEnquiries,
      latestAgents
    ] = await Promise.all([
      Agent.countDocuments({ role: ROLES.AGENT }),
      AdminLoginCredential.countDocuments({ role: { $in: [ROLES.SUPERADMIN, ROLES.ADMIN] } }),
      Itinerary.countDocuments(),
      Enquiry.countDocuments(),
      Enquiry.find().sort({ createdAt: -1 }).limit(3),
      Agent.find({ role: ROLES.AGENT }).sort({ createdAt: -1 }).limit(3)
    ]);

    const activities = [
      ...latestEnquiries.map(e => ({
        activity: `New Enquiry from ${e.name}`,
        user: e.email,
        time: e.createdAt,
        status: "Success"
      })),
      ...latestAgents.map(a => ({
        activity: `New Agent registered: ${a.company || a.firstName}`,
        user: a.email,
        time: a.createdAt,
        status: "Success"
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalAgents,
        totalAdmins,
        totalItineraries,
        totalEnquiries,
        activities,
        successRate: "99%" 
      }
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
