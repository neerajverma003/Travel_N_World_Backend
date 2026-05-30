import { Enquiry } from "../models/enquiry.js";
import { AppError } from "../utils/errorHandler.js";
import { sendEnquiryEmail } from "../utils/sendEmail.js";
import { Notification } from "../models/Notification.js";

/**
 * @desc Create a new enquiry (Public/User)
 * @route POST /api/enquiries
 * @access Public
 */
export const createEnquiry = async (req, res, next) => {
  try {
    // Create the enquiry
    let enquiry = await Enquiry.create(req.body);
    
    // Populate itinerary details for the email
    if (enquiry.itineraryId) {
      enquiry = await Enquiry.findById(enquiry._id).populate("itineraryId");
    }

    const io =req.app.get('socketio');

    // Craete Notification for SuperAdminnAnd Rm In DB

        // 🔔 Create notifications for Superadmin and RM in DB
    try {
      const { default: AgentModel } = await import("../models/agent.js");
      const notificationsToCreate = [];

      // 1. Fetch Superadmins from adminslogincredentials collection
      const { default: AdminLoginCredential } = await import("../models/adminLoginCredential.js");
      const superadmins = await AdminLoginCredential.find({ role: "SUPERADMIN", notificationsEnabled: { $ne: false } });
      console.log(" Found superadmins for notification:", superadmins.length);
      superadmins.forEach((admin) => {
        notificationsToCreate.push({
          recipient: admin._id,
          recipientRole: "SUPERADMIN",
          title: "New Enquiry Received",
          message: `New inquiry from ${enquiry.name} for ${enquiry.destination || 'Package'}.`,
          sourceType: "ENQUIRY",
          refId: enquiry._id,
        });
      });

      // 2. Fetch Agent and their RM
      if (enquiry.agentId) {
        const agent = await AgentModel.findById(enquiry.agentId);
        if (agent) {
          // Notify Agent
          notificationsToCreate.push({
            recipient: agent._id,
            recipientRole: "AGENT",
            title: "New Lead",
            message: `You received a new lead from ${enquiry.name}.`,
            sourceType: "ENQUIRY",
            refId: enquiry._id,
          });

          // Notify RM if mapped to agent
          if (agent.relationshipManagerId) {
            notificationsToCreate.push({
              recipient: agent.relationshipManagerId,
              recipientRole: "RM",
              title: "New Lead for Managed Agent",
              message: `Agent ${agent.company || agent.firstName} received a new lead from ${enquiry.name}.`,
              sourceType: "ENQUIRY",
              refId: enquiry._id,
            });
          }
        }
      }

      // Bulk save to Database
      console.log(" Total notifications to create:", notificationsToCreate.length);
      if (notificationsToCreate.length > 0) {
        const saved = await Notification.insertMany(notificationsToCreate);
        // Emit real-time notification event to all connected clients
        const io = req.app.get('socketio');
        if (io) {
          io.emit('new-notification', { notifications: notificationsToCreate });
        }
        console.log(" Notifications saved:", saved.length);
      } else {
        console.log(" No notifications to create - superadmins array was empty");
      }
    } catch (notifErr) {
      console.error(" Failed to generate DB notifications:", notifErr);
    }

    io.emit('new-enquiry',enquiry);

    // Send Email to Superadmin & Agent
    let agent = null;
    try {
      if (enquiry.agentId) {
        const { default: AgentModel } = await import("../models/agent.js");
        agent = await AgentModel.findById(enquiry.agentId);
      }
      
      // Send Emails (Background task)
      sendEnquiryEmail(enquiry, agent).catch(err => {
        console.error("Delayed Email Error:", err);
      });

      return res.status(201).json({
        success: true,
        message: "Enquiry submitted successfully!",
        data: enquiry,
      });
    } catch (emailError) {
      console.error("Failed to initiate enquiry email process:", emailError);
      return res.status(201).json({
        success: true,
        message: "Enquiry submitted successfully!",
        data: enquiry,
      });
    }
  } catch (error) {
    console.error("Error creating enquiry:", error);
    next(new AppError("Failed to submit enquiry", 500));
  }
};

/**
 * @desc Get all enquiries (Admin)
 * @route GET /api/enquiries
 * @access Private (Admin)
 */
export const getAllEnquiries = async (req, res, next) => {
  try {
    const { agentId } = req.query;
    let query = {};
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === "RM") {
      const { default: AgentModel } = await import("../models/agent.js");
      const myAgents = await AgentModel.find({ relationshipManagerId: userId }).select("_id");
      const agentIds = myAgents.map(a => a._id);
      query.agentId = { $in: agentIds };
    } else if (agentId) {
      // If agentId is provided, show only that agent's leads
      query.agentId = agentId;
    }
    // Note: We removed the restriction that only showed global leads to SuperAdmins.
    // SuperAdmins should be able to see all leads in the Transport/Customer Inquiries table.

    const enquiries = await Enquiry.find(query)
      .populate("agentId", "firstName lastName company email agentCategory")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      total: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    next(new AppError("Failed to fetch enquiries", 500));
  }
};

/**
 * @desc Get enquiries for a specific agent (Agent)
 * @route GET /api/enquiries/my-leads
 * @access Private (Agent)
 */
export const getAgentEnquiries = async (req, res, next) => {
  try {
    const agentId = req.user.id; // From auth middleware
    const agent = await (await import("../models/agent.js")).default.findById(agentId);
    const enquiries = await Enquiry.find({ agentId }).sort({ createdAt: -1 });

    const isVerified = agent?.isVerified === true;

    // Mask data if agent is NOT verified
    const processedEnquiries = enquiries.map(e => {
      const enquiry = e.toObject();
      if (!isVerified) {
        return {
          ...enquiry,
          name: (enquiry.name || "Customer").charAt(0) + "*****",
          email: (enquiry.email || "").split("@")[0].charAt(0) + "****@" + (enquiry.email || "").split("@")[1],
          phone: (enquiry.phone || "").substring(0, 2) + "******" + (enquiry.phone || "").substring(8),
          isMasked: true
        };
      }
      return enquiry;
    });

    return res.status(200).json({
      success: true,
      total: processedEnquiries.length,
      isVerifiedAgent: isVerified,
      data: processedEnquiries,
    });
  } catch (error) {
    console.error("Error fetching agent enquiries:", error);
    next(new AppError("Failed to fetch leads", 500));
  }
};

/**
 * @desc Delete an enquiry (Admin)
 * @route DELETE /api/enquiries/:id
 * @access Private (Admin)
 */
export const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return next(new AppError("Enquiry not found", 404));
    }
    return res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    next(new AppError("Failed to delete enquiry", 500));
  }
};

/**
 * @desc Get buyable leads (leads from unverified agents)
 * @route GET /api/enquiries/buy-leads
 * @access Private (Agent)
 */
export const getBuyableLeads = async (req, res, next) => {
  try {
    const { default: Agent } = await import("../models/agent.js");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page-1)*limit;
    const { source, notSource } = req.query;

    // 3 Define query: Show all enquiries that are not 'Booked'
    const marketplaceQuery = {
      status: { $ne: "Booked" }
    };
    
    if (source) {
      marketplaceQuery.source = source;
    }
    if (notSource) {
      marketplaceQuery.source = { $ne: notSource };
    }

    // 4 get total count for pagination metadata
    const total = await Enquiry.countDocuments(marketplaceQuery);

    // 5 find enquiries with skip and limit
    const enquires = await Enquiry.find(marketplaceQuery)
      .populate("itineraryId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

     
    // send response
    return res.status(200).json({
      success:true,
      total,
      page,
      limit,
      totalPages:Math.ceil(total/limit),
      data:enquires,
    })

  } catch (error) {
    console.error("Error fetching buyable leads:", error);
    next(new AppError("Failed to fetch buyable leads", 500));
  }
};

/**
 * @desc Update enquiry status (Agent/Admin)
 * @route PATCH /api/enquiries/:id/status
 * @access Private (Agent/Admin)
 */
export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["New", "Hot", "Follow-up", "Booked"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return next(new AppError("Enquiry not found", 404));
    }

    // Security: Only the assigned agent or an admin can update
    // (Assuming req.user exists from auth middleware)
    if (req.user.role !== 'admin' && enquiry.agentId?.toString() !== req.user.id) {
      return next(new AppError("Not authorized to update this lead", 403));
    }

    enquiry.status = status;
    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: `Lead status updated to ${status}`,
      data: enquiry
    });
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    next(new AppError("Failed to update status", 500));
  }
};
