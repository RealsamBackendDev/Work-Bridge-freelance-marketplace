const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../../utils/tokens");
const { generateOtp, hashOtp, otpExpiry } = require("../../utils/otp");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../../utils/email");

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  skills: user.skills,
  hourlyRate: user.hourlyRate,
  emailVerified: user.emailVerified,
  kycStatus: user.kycStatus,
});

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const payload = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(payload.exp * 1000),
    },
  });
  return { user: publicUser(user), accessToken, refreshToken };
};

const createAndSendOtp = async (user, type) => {
  const code = generateOtp();
  await prisma.otpToken.create({
    data: { userId: user.id, codeHash: hashOtp(code), type, expiresAt: otpExpiry() },
  });
  if (type === "PASSWORD_RESET") {
    await sendPasswordResetEmail(user.email, code);
  } else {
    await sendVerificationEmail(user.email, code);
  }
};

exports.register = async ({ name, email, phone, password, role }) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    throw new ApiError(
      409,
      existing.email === email
        ? "An account with this email already exists"
        : "An account with this phone number already exists"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
  });

  await createAndSendOtp(user, "EMAIL_VERIFICATION");
  return {
    user: publicUser(user),
    message: "Registration successful. Check your email for the verification code.",
  };
};

exports.verifyEmail = async ({ email, code }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "Account not found");
  if (user.emailVerified) throw new ApiError(400, "Email is already verified");

  const otp = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.codeHash !== hashOtp(code)) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  await prisma.$transaction([
    prisma.otpToken.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    }),
  ]);
  return { verified: true };
};

exports.resendVerification = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) return { sent: true };

  const recent = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });
  if (recent) throw new ApiError(429, "Please wait a minute before requesting another code");

  await createAndSendOtp(user, "EMAIL_VERIFICATION");
  return { sent: true };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) throw new ApiError(403, "Account deactivated. Contact support.");
  if (!user.emailVerified) {
    throw new ApiError(403, "Email not verified. Please verify your email, then log in.");
  }
  return issueTokens(user);
};

exports.refresh = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new ApiError(401, "Account not found");

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  return issueTokens(user);
};

exports.logout = async (refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  return { revoked: true };
};

exports.submitKyc = async ({ userId, documentType, documentNumber, documentImage }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "FREELANCER") throw new ApiError(403, "KYC verification is only for freelancers");
  if (!user.emailVerified) throw new ApiError(400, "Verify your email before submitting KYC");
  if (user.kycStatus === "PENDING") throw new ApiError(400, "KYC is already under review");
  if (user.kycStatus === "VERIFIED") throw new ApiError(400, "KYC already verified");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: "PENDING",
      kycDocumentType: documentType,
      kycDocumentNo: documentNumber,
      kycDocumentImg: documentImage || null,
    },
  });
  return { user: publicUser(updated) };
};

exports.reviewKyc = async ({ userId, action, reason }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.kycStatus !== "PENDING") throw new ApiError(400, "No pending KYC for this user");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED",
      kycReviewedAt: new Date(),
    },
  });
  return { user: publicUser(updated) };
};

exports.forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const recent = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (!recent) await createAndSendOtp(user, "PASSWORD_RESET");
  }
  return { sent: true };
};

exports.resetPassword = async ({ email, code, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, "Invalid or expired reset code");

  const otp = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      type: "PASSWORD_RESET",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.codeHash !== hashOtp(code)) {
    throw new ApiError(400, "Invalid or expired reset code");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.otpToken.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  return { reset: true };
};