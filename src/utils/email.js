const { Resend } = require("resend");
const env = require("../config/env");

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const sendEmail = async ({ to, subject, text, html }) => {
  if (!resend) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false, devLogged: true };
  }
  await resend.emails.send({
    from: env.SMTP_FROM || "WorkBridge <onboarding@resend.dev>",
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
};

exports.sendVerificationEmail = (to, code) =>
  sendEmail({
    to,
    subject: "Verify your WorkBridge email",
    text: `Your WorkBridge verification code is: ${code}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.`,
    html: `<h2>${code}</h2><p>Expires in ${env.OTP_EXPIRES_MINUTES} minutes. If you didn't sign up, ignore this email.</p>`,
  });

exports.sendPasswordResetEmail = (to, code) =>
  sendEmail({
    to,
    subject: "Reset your WorkBridge password",
    text: `Your password reset code is: ${code}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.`,
    html: `<h2>${code}</h2><p>Expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>`,
  });