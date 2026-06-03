import { Contact } from "../models/Contact.js";
import { Notification } from "../models/Notification.js";

// Create a new contact inquiry
export const createContactInquiry = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, description } = req.body;
    
    const newContact = await Contact.create({
      firstName,
      lastName,
      phone,
      email,
      description
      
    });

    // 🔔 Notify all Superadmins about new Contact Us submission
    try {
      const { default: AdminLoginCredential } = await import("../models/adminLoginCredential.js");
      const superadmins = await AdminLoginCredential.find({ role: "SUPERADMIN", notificationsEnabled: { $ne: false } });
      
      if (superadmins.length > 0) {
        const notifs = superadmins.map((admin) => ({
          recipient: admin._id,
          recipientRole: "SUPERADMIN",
          title: "New Contact Us Message",
          message: `${firstName} ${lastName} sent a contact message: "${(description || "").slice(0, 60)}..."`,
          sourceType: "CONTACT",
          refId: newContact._id,
        }));
        await Notification.insertMany(notifs);
      }
    } catch (notifErr) {
      console.error("Contact notification error:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We will get back to you soon.",
      data: newContact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all contact inquiries (for Admin)
export const getContactInquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Contact.countDocuments();
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a contact inquiry
export const deleteContactInquiry = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: "Inquiry not found" });
    res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
