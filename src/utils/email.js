const nodemailer = require("nodemailer");
const env = require("../config/env");

const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT) || 587,
  secure: Number(env.SMTP_PORT) === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 15000,
});

exports.sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false, devLogged: true };
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
  return { delivered: true };
};

exports.sendVerificationEmail = (to, code) =>
  exports.sendEmail({
    to,
    subject: "Verify your WorkBridge email",
    text: `Your WorkBridge verification code is: ${code}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.`,
    html: `<h2>${code}</h2><p>Expires in ${env.OTP_EXPIRES_MINUTES} minutes. If you didn't sign up, ignore this email.</p>`,
  });

  exports.sendPasswordResetEmail = (to, code) =>
  exports.sendEmail({
    to,
    subject: "Reset your WorkBridge password",
    text: `Your password reset code is: ${code}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes. If you did not request this, ignore this email.`,
    html: `<h2>${code}</h2><p>Expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>`,
  });