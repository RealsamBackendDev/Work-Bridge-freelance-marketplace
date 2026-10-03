const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const profileView = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  avatar: u.avatar,
  bio: u.bio,
  location: u.location,
  skills: u.skills,
  hourlyRate: toMoney(u.hourlyRate),
  balance: toMoney(u.balance),
  emailVerified: u.emailVerified,
  kycStatus: u.kycStatus,
  kycDocumentType: u.kycDocumentType,
  kycDocumentNo: u.kycDocumentNo,
  kycDocumentImg: u.kycDocumentImg,
  createdAt: u.createdAt,
});

exports.getMyProfile = async ({ userId }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  return { user: profileView(user) };
};

exports.updateProfile = async ({ userId, update }) => {
  await prisma.user.findUnique({ where: { id: userId } });
  const user = await prisma.user.update({ where: { id: userId }, data: update });
  return { user: profileView(user) };
};