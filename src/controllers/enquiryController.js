import { Enquiry } from "../models/enquiry.js";
import { AppError } from "../utils/errorHandler.js";
import { sendEnquiryEmail } from "../utils/sendEmail.js";

/**
 * @desc Create a new enquiry (Public/User)
 * @route POST /api/enquiries
 * @access Public
 */
export const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.create(req.body);

    // ✅ Send Email to Superadmin & Agent
    try {
      let agentEmail = null;
      if (enquiry.agentId) {
        const { default: Agent } = await import("../models/agent.js");
        const agent = await Agent.findById(enquiry.agentId);
        if (agent) agentEmail = agent.email;
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
    
    if (agentId) {
      // If agentId is provided, show only that agent's leads
      query.agentId = agentId;
    } else {
      // If no agentId is provided, show ONLY global leads (where agentId is null or doesn't exist)
      query.$or = [{ agentId: null }, { agentId: { $exists: false } }];
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });
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
