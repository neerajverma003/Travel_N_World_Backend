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
  if (!to) return null;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return null;
  }
};

// ✅ Specific function for OTP
export const sendOTPEmail = async (email, otp) => {
  const subject = "Travel N World - OTP Verification";
  const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Verification Code</h2>
        <p>Your 6-digit verification code is: <strong style="font-size: 24px; color: #dc2626;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
  return await sendEmail(email, subject, html);
};

// ✅ Specific function for Enquiries
export const sendEnquiryEmail = async (enquiryData, agent = null) => {
  const data = enquiryData.toObject ? enquiryData.toObject() : enquiryData;
  const { 
    name, email, phone, countryCode, location, fromCity, 
    travelDate, travelDuration, adults, children, infants,
    tripCategory, hotelCategory, travelWith, budget,
    ticketBooked, ticketRequired, transportMode, itineraryTitle, itineraryId,
    dob, gender, maritalStatus, monthlyIncome, nationality
  } = data;

  const subject = itineraryTitle 
    ? `[FULL LEAD] ${itineraryTitle} - ${name}`
    : `[QUERY] ${location} - ${name}`;

  const buildSection = (title, content, color = "#64748b") => `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: ${color}; font-weight: 800;">${title}</h3>
      ${content}
    </div>
  `;

  const buildRow = (label, value) => {
    if (value === undefined || value === null || value === "" || value === "Select Status") return "";
    return `<p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong style="color: #64748b;">${label}:</strong> ${value}</p>`;
  };

  const getFullHtml = (isMasked = false) => {
    const displayPhone = isMasked 
      ? (phone || "").substring(0, 2) + "******" + (phone || "").substring(8)
      : `${countryCode || ""} ${phone}`;
    
    const displayEmail = isMasked
      ? (email || "").split("@")[0]?.charAt(0) + "****@" + (email || "").split("@")[1]
      : (email || "Not Provided");

    const displayName = isMasked ? name.charAt(0) + "*****" : name;

    // Itinerary Info if populated
    const iten = itineraryId || {};

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; background: white; padding: 20px; border: 1px solid #f1f5f9; border-radius: 20px;">
        <div style="text-align: center; padding: 10px 0 30px;">
          <h1 style="color: #ef4444; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em;">Travel N World</h1>
          <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 10px; color: #94a3b8; font-weight: 800; margin-top: 5px;">High Fidelity Lead Intelligence</p>
        </div>

        ${iten.title ? buildSection("Selected Package Details", `
          ${buildRow("Package Name", iten.title)}
          ${buildRow("Price/Person", iten.price ? `₹${iten.price}` : "Contact for Price")}
          ${buildRow("Package Type", iten.theme || "Standard")}
          ${buildRow("Main Destination", iten.destination)}
        `, "#ef4444") : ""}

        ${buildSection("Customer Profile", `
          ${buildRow("Name", displayName)}
          ${buildRow("Phone", displayPhone)}
          ${buildRow("Email", displayEmail)}
          ${buildRow("Date of Birth", dob ? new Date(dob).toLocaleDateString() : "")}
          ${buildRow("Gender", gender)}
          ${buildRow("Marital Status", maritalStatus)}
          ${buildRow("Monthly Income", monthlyIncome)}
          ${buildRow("Nationality", nationality)}
        `)}

        ${buildSection("Travel Requirements", `
          ${buildRow("Destination Info", location)}
          ${buildRow("Traveling From", fromCity)}
          ${buildRow("Trip Category", tripCategory?.toUpperCase())}
          ${buildRow("Travel Date", travelDate ? new Date(travelDate).toDateString() : "Flexible")}
          ${buildRow("Duration", `${travelDuration} Days`)}
          ${buildRow("Occupancy", `${adults} Adults, ${children} Children, ${infants} Infants`)}
          ${buildRow("Hotel Preferences", hotelCategory)}
          ${buildRow("Traveling With", travelWith)}
          ${buildRow("Estimated Budget", budget ? `₹${budget}` : "")}
        `)}

        ${buildSection("Transport & Logistics", `
          ${buildRow("Already Booked?", ticketBooked)}
          ${buildRow("Need Booking Help?", ticketRequired)}
          ${buildRow("Preferred Mode", transportMode)}
        `)}

        ${isMasked ? `
          <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 12px; color: #9a3412; font-size: 13px; text-align: center; font-weight: 800; margin-top: 20px;">
            ⚠️ DATA MASKED: Agent is currently unverified.
          </div>
        ` : ""}

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; pt-20">
          <p style="font-size: 11px; color: #cbd5e1; font-weight: 600;">© ${new Date().getFullYear()} Travel N World Portal. This is an automated business intelligence report.</p>
        </div>
      </div>
    `;
  };

  // 1. Send FULL INFO to Superadmin
  if (process.env.SUPERADMIN_EMAIL) {
    await sendEmail(process.env.SUPERADMIN_EMAIL, `[ADMIN] ${subject}`, getFullHtml(false));
  }
  
  // 2. Send to Agent (Masked if not verified)
  if (agent && agent.email) {
    const isVerified = agent.isVerified === true;
    await sendEmail(agent.email, isVerified ? subject : `[MASKED] ${subject}`, getFullHtml(!isVerified));
  }
};

export default sendOTPEmail;
