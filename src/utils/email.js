const env = require("../config/env");

const sendEmail = async ({ to, subject, text, html }) => {
  if (!env.SENDGRID_API_KEY) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false, devLogged: true };
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.MAIL_FROM || "yourgmail@gmail.com" },
      subject,
      content: [
        { type: "text/plain", value: text },
        ...(html ? [{ type: "text/html", value: html }] : []),
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`SendGrid ${res.status}: ${detail}`);
  }
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