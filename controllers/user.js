const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const userImageUpdator = require('../utility/user-image-updator');
const Joi = require('joi');
const { escapeHtml } = require('@hapi/hoek');
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
    // Validation
    const schema = Joi.object().keys({
      firstName: Joi.string()
        .trim()
        .min(3)
        .max(64)
        .required()
        .custom((value) => escapeHtml(value)),
      lastName: Joi.string()
        .trim()
        .min(3)
        .max(64)
        .required()
        .custom((value) => escapeHtml(value)),
      email: Joi.string().lowercase().email().min(3).max(254).required(),
      bio: Joi.string()
        .trim()
        .min(0)
        .max(64)
        .required()
        .custom((value) => escapeHtml(value)),
      role: Joi.string()
        .trim()
        .min(0)
        .max(64)
        .required()
        .custom((value) => escapeHtml(value)),
      gender: Joi.string().trim().required().valid('Female', 'Male', 'Third Gender'),
      currency: Joi.string()
        .trim()
        .valid('($)USD', 'wETH', 'BIT Coin')
        .required()
        .custom((value) => escapeHtml(value)),
      phoneNumber: Joi.string()
        .trim()
        .min(10)
        .max(16)
        .required()
        .pattern(/^\+\d+$/),
      location: Joi.string().min(0).max(32).valid('United State', 'KATAR', 'Canada').required(),
      address: Joi.string()
        .min(0)
        .max(128)
        .required()
        .custom((value) => escapeHtml(value)),
    });

    const validationResult = schema.validate({
      firstName,
      lastName,
      email,
      bio,
      role,
      gender,
      currency,
      phoneNumber,
      location,
      address,
    });
    if (validationResult.error) return res.status(400).json(validationResult.error);

    // Update
    if (req.user.email != email) {
      const userExist = await prisma.user.findFirst({ where: { email: email } });
      if (userExist) return res.status(400).json({ userExist: true });
    }
    const updatedUser = await prisma.user.update({
      where: { email: req.user.email },
      data: {
        first_name: validationResult.value.firstName,
        last_name: validationResult.value.lastName,
        email: validationResult.value.email,
        bio: validationResult.value.bio,
        role: validationResult.value.role,
        gender: validationResult.value.gender,
        currency: validationResult.value.currency,
        phone_number: validationResult.value.phoneNumber,
        location: validationResult.value.location,
        address: validationResult.value.address,
      },
    });
    req.user.email = email;
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, password, rePassword } = req.body;

    const schema = Joi.object().keys({
      oldPassword: Joi.string().trim().min(8).max(128).required(),
      password: Joi.string().trim().min(8).max(128).required(),
      rePassword: Joi.string()
        .trim()
        .min(8)
        .max(128)
        .required()
        .custom((value, helpers) => {
          if (password == rePassword) return value;
          return helpers.message('password and rePassword does not match');
        }),
    });

    const validationResult = schema.validate({
      oldPassword,
      password,
      rePassword,
    });

    if (validationResult.error) return res.status(400).json(validationResult.error);

    const { password: currentPassword } = await prisma.user.findFirst({
      where: {
        email: req.user.email,
      },
      select: { password: true },
    });
    const isCorrectPassword = await bcrypt.compare(validationResult.value.oldPassword, currentPassword);
    if (!isCorrectPassword) res.status(400).json({ incorrectPassword: 'your old password is incorrect' });

    const hashedPassword = await bcrypt.hash(validationResult.value.password, 12);
    await prisma.user.update({ where: { email: req.user.email }, data: { password: hashedPassword } });

    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};
