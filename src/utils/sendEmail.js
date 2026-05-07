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
export const sendEnquiryEmail = async (enquiryData, agentEmail = null) => {
  const { name, company_name, email, phone, countryCode, location, your_requirements, itineraryTitle } = enquiryData;
  const subject = itineraryTitle 
    ? `New Lead for "${itineraryTitle}" from ${name}`
    : `New Business Query from ${name}`;

  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">New Lead Received</h2>
      
      ${itineraryTitle ? `<p style="background: #fef2f2; padding: 10px; border-radius: 5px;"><strong>Interest in Package:</strong> <span style="color: #dc2626;">${itineraryTitle}</span></p>` : ""}

      <p><strong>Customer Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${countryCode} ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Location:</strong> ${location}</p>
      ${company_name ? `<p><strong>Company:</strong> ${company_name}</p>` : ""}
      
      <p><strong>Special Requirements:</strong></p>
      <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc; margin: 10px 0;">
        ${your_requirements || "No specific requirements provided."}
      </blockquote>
      
      <br>
      <p style="font-size: 14px; color: #666;">This is an automated lead notification. Please follow up with the client directly.</p>
    </div>
  `;
  
  // Send to Superadmin
  await sendEmail(process.env.SUPERADMIN_EMAIL, subject, html);
  
  // Also send to Agent if they have a specific lead
  if (agentEmail) {
    await sendEmail(agentEmail, subject, html);
  }
};

export default sendOTPEmail;
