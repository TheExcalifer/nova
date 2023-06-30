const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validationResult } = require('express-validator');
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
exports.editProfileInformation = async (req, res) => {
  try {
    const { firstName, lastName, email, bio, role, gender, currency, phoneNumber, location, address } = req.body;

    const validationErrors = validationResult(req).errors;
    if (validationErrors.length != 0) return res.status(400).json({ errors: { validationErrors } });
    if (req.user.email != email) {
      const userExist = await prisma.user.findFirst({ where: { email: email } });
      if (userExist) return res.status(400).json({ errors: { userExist: true } });
    }
    const updatedUser = await prisma.user.update({
      where: { email: req.user.email },
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        bio: bio,
        role: role,
        gender: gender,
        currency: currency,
        phone_number: phoneNumber,
        location: location,
        address: address,
      },
    });
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};
