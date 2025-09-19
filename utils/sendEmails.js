const nodemailer = require("nodemailer");
console.log("process.env.ZOHO_PASSWORD",process.env.ZOHO_USER)
const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_HOST,
  port: process.env.ZOHO_PORT,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASSWORD,
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"Vizchat" <${process.env.ZOHO_USER}>`,
      to,
      subject,
      text,
    });
    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
}

module.exports = sendEmail;
