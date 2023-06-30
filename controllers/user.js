const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const userImageUpdator = require('../utility/user-image-updator');

exports.editProfileImage = async (req, res) => {
  try {
    userImageUpdator(req, res, 'profile', 'profile', 'profile_image');
  } catch (error) {
    res.status(500).json();
  }
};
exports.editCoverImage = async (req, res) => {
  try {
    userImageUpdator(req, res, 'cover', 'cover', 'cover_image');
  } catch (error) {
    res.status(500).json();
  }
};
