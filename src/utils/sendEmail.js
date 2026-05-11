import nodemailer from "nodemailer";

// ✅ Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Generic sendEmail function
export const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// ✅ Specific function for OTP (for backward compatibility if needed elsewhere)
export const sendOTPEmail = async (email, otp) => {
  const subject = "Your HelloTravel Agent OTP";
  const html = `
      <h2>Welcome to HelloTravel!</h2>
      <p>Your 6-digit verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>Do not share it with anyone.</p>
    `;
  return await sendEmail(email, subject, html);
};

// ✅ Specific function for Enquiries
export const sendEnquiryEmail = async (enquiryData, agent = null) => {
  const { name, company_name, email, phone, countryCode, location, your_requirements, itineraryTitle } = enquiryData;
  const isAgentVerified = agent?.isVerified === true;

  const subject = itineraryTitle 
    ? `New Lead for "${itineraryTitle}" from ${name}`
    : `New Business Query from ${name}`;

  // Helper to build HTML table rows
  const buildRow = (label, value) => `<p><strong>${label}:</strong> ${value}</p>`;

  const htmlTemplate = (customerName, customerEmail, customerPhone, isMasked = false) => `
    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">New Lead Received</h2>
      
      ${itineraryTitle ? `<p style="background: #fef2f2; padding: 10px; border-radius: 5px;"><strong>Interest in Package:</strong> <span style="color: #dc2626;">${itineraryTitle}</span></p>` : ""}

      ${buildRow("Customer Name", customerName)}
      ${buildRow("Phone", customerPhone)}
      ${buildRow("Email", customerEmail)}
      ${buildRow("Location", location)}
      ${company_name ? buildRow("Company", company_name) : ""}
      
      <p><strong>Special Requirements:</strong></p>
      <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc; margin: 10px 0;">
        ${your_requirements || "No specific requirements provided."}
      </blockquote>
      
      ${isMasked ? `<div style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 8px; color: #92400e; font-size: 13px; margin-top: 15px; font-weight: bold;">⚠️ You are currently unverified. Please get verified by Superadmin to view full customer contact details.</div>` : ""}

      <br>
      <p style="font-size: 14px; color: #666;">This is an automated lead notification. Please follow up with the client directly.</p>
    </div>
  `;
  
  // 1. Send FULL INFO to Superadmin
  await sendEmail(process.env.SUPERADMIN_EMAIL, subject, htmlTemplate(name, email, `${countryCode || ""} ${phone}`));
  
  // 2. Send to Agent (Masked if not verified)
  if (agent && agent.email) {
    if (isAgentVerified) {
      // Send FULL INFO to verified agent
      await sendEmail(agent.email, subject, htmlTemplate(name, email, `${countryCode || ""} ${phone}`));
    } else {
      // Send MASKED INFO to unverified agent
      const maskedName = name.charAt(0) + "*****";
      const maskedEmail = email.split("@")[0].charAt(0) + "****@" + email.split("@")[1];
      const maskedPhone = (phone || "").substring(0, 2) + "******" + (phone || "").substring(8);
      
      await sendEmail(agent.email, `[MASKED] ${subject}`, htmlTemplate(maskedName, maskedEmail, `${countryCode || ""} ${maskedPhone}`, true));
    }
  }
};

export default sendOTPEmail;
