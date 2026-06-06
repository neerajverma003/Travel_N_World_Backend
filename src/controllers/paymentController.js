import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Enquiry } from '../models/enquiry.js'; // Ensure correct path to your Enquiry model

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID_HERE', 
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET_HERE',
});

// 1. Order Create karna
export const createOrder = async (req, res) => {
  try {
    const { amount, leadId } = req.body; // Amount frontend se aayega

    const options = {
      amount: amount * 100, // Razorpay paise me amount leta hai
      currency: "INR",
      receipt: `rcpt_${Date.now()}`, // Keep under 40 characters!
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ success: false, message: "Order creation failed" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Payment Verify karna aur Lead assign karna
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, leadId, agentId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment verify ho gayi, ab Lead Agent ko assign kar do
      const lead = await Enquiry.findById(leadId);
      if(!lead){
         return res.status(404).json({ success: false, message: "Lead not found" });
      }

      // Update lead
      lead.agentId = agentId;
      lead.soldCount = (lead.soldCount || 0) + 1; // Agar multple agents buy kar sakte hain to
      await lead.save();

      res.status(200).json({ success: true, message: "Payment successful and lead assigned!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
