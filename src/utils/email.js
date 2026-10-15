const env = require("../config/env");

const sendEmail = async ({ to, subject, text, html }) => {
  if (!env.BREVO_API_KEY) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false, devLogged: true };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM || "yourgmail@gmail.com", name: "WorkBridge" },
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(html ? { htmlContent: html } : {}),
    }),
  });

  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
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