const nodemailer = require('nodemailer');
const crypto = require('crypto');


// Store OTPs in memory or DB if needed (in-memory for demo)
const otpStore = {};

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPToEmail(email) {
  const otp = generateOTP();

  // Save to memory or DB
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins expiry
  };

  // Setup your transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another like Outlook, etc.
    auth: {
      user: process.env.NODEMAILER_EMAIL, // from .env
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"HAMD Sofa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - OTP from HAMD Sofa',
    html: `
      <p>Hello,</p>
      <p>Your OTP for verifying your email is:</p>
      <h2 style="color:#2B2B2B;">${otp}</h2>
      <p>This OTP is valid for 5 minutes.</p>
      <p>Regards,<br/>HAMD Sofa Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  console.log(`OTP sent to ${email}: ${otp}`);
  return otp;
}
 
function verifyOTP(email, enteredOtp) {
  const record = otpStore[email];
  if (!record) return false;

  const isValid = record.otp === enteredOtp && Date.now() < record.expiresAt;
  if (isValid) {
    delete otpStore[email]; // Optional: clear OTP after verification
  }
  return isValid;
}

module.exports = {
  sendOTPToEmail,
  verifyOTP,
};