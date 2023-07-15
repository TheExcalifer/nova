const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const userImageUpdator = require('../utility/user-image-updator');
const Joi = require('joi');
const { escapeHtml } = require('@hapi/hoek');
const { formidable, errors: formidableErrors } = require('formidable');
const path = require('path');
const extensionExtractor = require('../utility/extension-extractor');
const addDays = require('../utility/add-days');
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

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.user.email },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        profile_image: true,
        cover_image: true,
        role: true,
        gender: true,
        currency: true,
        phone_number: true,
        location: true,
        address: true,
        bio: true,
        balance: true,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json();
  }
};

exports.createNFT = async (req, res) => {
  try {
    const PRODUCT_PATH = '/product/';
    let fileExtensionError;
    const productImagesName = [];
    // Upload Config
    const form = formidable({
      maxFiles: 3,
      maxFileSize: 1 * 200 * 1024,
      uploadDir: path.join('public', 'product'),
      filter: ({ name, originalFilename, mimetype }) => {
        if (name != 'productImages') return false;
        const fileExtension = extensionExtractor(originalFilename);
        if (fileExtension != 'png' && fileExtension != 'jpg' && fileExtension != 'jpeg') {
          fileExtensionError = true;
          return false;
        }
        return true;
      },
      filename: (name, ext, part, form) => {
        const fileExtension = extensionExtractor(part.originalFilename);
        const randomNumber = Math.round(Math.random() * 1e10);
        const newFileName = `${randomNumber}.${fileExtension}`;
        productImagesName.push({ image: PRODUCT_PATH + newFileName });
        return newFileName;
      },
    });

    form.parse(req, async (err, fields, files) => {
      const { productName, description, royality, categoryId } = fields;
      // Validation
      const schema = Joi.object().keys({
        productName: Joi.string()
          .trim()
          .required()
          .custom((value) => escapeHtml(value)),
        description: Joi.string()
          .trim()
          .required()
          .custom((value) => escapeHtml(value)),
        royality: Joi.number().min(0).max(99).required(),
        categoryId: Joi.number().required(),
      });
      const validationResult = schema.validate({
        productName: productName[0],
        description: description[0],
        royality: Number(royality[0]),
        categoryId: Number(categoryId[0]),
      });

      // Error handling
      if (files.productImages?.length != 3) return res.status(400).json({ invalidTotalFiles: 'You must send 3 files' });

      const existCategory = await prisma.category.findFirst({ where: { id: validationResult.value.categoryId } });
      if (!existCategory) return res.status(400).json({ invalidCategoryId: 'Category is invalid' });

      if (validationResult.error) return res.status(400).json(validationResult.error);

      if (err?.code == formidableErrors.biggerThanTotalMaxFileSize)
        return res.status(400).json({ maxFileNumber: 'Max file size is 200kb' });

      if (err?.code == formidableErrors.maxFilesExceeded)
        return res.status(400).json({ maxFileNumber: 'Max number of file is 3' });

      if (fileExtensionError) return res.status(400).json({ allowFormat: 'Allow formats: jpeg, jpg, png' });

      const createdProduct = await prisma.product.create({
        data: {
          productName: validationResult.value.productName,
          description: validationResult.value.description,
          royality: validationResult.value.royality,
          categoryId: validationResult.value.categoryId,
          creatorId: req.user.id,
          ownerId: req.user.id,
          expireTime: addDays(new Date(), 1),
          Product_Image: { createMany: { data: productImagesName } },
        },
      });

      res.status(200).json(createdProduct);
    });
  } catch (error) {
    res.status(500).json();
  }
};
exports.favorite = async (req, res) => {
  try {
    const productId = req.body.productId;
    // Validation
    const schema = Joi.object().keys({
      productId: Joi.number().positive().required(),
    });
    const validationResult = schema.validate({
      productId,
    });
    if (validationResult.error) return res.status(400).json(validationResult.error);

    // Prevent twice like a product from same user
    const likedBefore = await prisma.likes.findFirst({
      where: {
        userId: req.user.id,
        productId: validationResult.value.productId,
      },
    });
    if (likedBefore) return res.status(400).json({ twiceLike: 'You liked this post already' });

    await prisma.likes.create({
      data: {
        productId: validationResult.value.productId,
        userId: req.user.id,
      },
    });
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};
exports.unfavorite = async (req, res) => {
  try {
    const productId = req.body.productId;

    // Validation
    const schema = Joi.object().keys({
      productId: Joi.number().positive().required(),
    });
    const validationResult = schema.validate({
      productId,
    });

    if (validationResult.error) return res.status(400).json(validationResult.error);

    await prisma.likes.deleteMany({
      where: { userId: req.user.id, productId: validationResult.value.productId },
    });

    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};
exports.bid = async (req, res) => {
  try {
    const { productId, bidAmount } = req.body;

    // Validation
    const schema = Joi.object().keys({
      productId: Joi.number()
        .positive()
        .required()
        .custom((value) => Number(value.toFixed(2))),
      bidAmount: Joi.number()
        .positive()
        .required()
        .custom((value) => Number(value.toFixed(2))),
    });
    const validationResult = schema.validate({
      productId,
      bidAmount,
    });
    if (validationResult.error) return res.status(400).json(validationResult.error);

    // Check user balance
    const { balance: userBalance } = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
      select: {
        balance: true,
      },
    });

    // Check total user bids amount
    const {
      _sum: { bidAmount: totalUserActiveBidsAmount },
    } = await prisma.bids.aggregate({
      where: {
        userId: req.user.id,
        active: true,
      },
      _sum: {
        bidAmount: true,
      },
    });

    const userAvailableMoney = userBalance - totalUserActiveBidsAmount;

    if (userAvailableMoney < validationResult.value.bidAmount)
      return res.status(400).json({ notEnoughMoney: 'Your balance is not enough' });

    const product = await prisma.product.findFirst({
      where: {
        id: validationResult.value.productId,
      },
      include: {
        Bids: {
          take: 1,
          orderBy: { bidAmount: 'desc' },
        },
      },
    });
    const { bidAmount: highestBidAmount } = product.Bids.at(0) ?? Number.NEGATIVE_INFINITY;

    if (product.expireTime < Date.now()) return res.status(400).json({ expireTime: 'bid time has ended' });

    if (validationResult.value.bidAmount <= highestBidAmount)
      return res.status(400).json({ notEnoughBid: 'Your bid amount is not enough' });

    await prisma.bids.create({
      data: {
        userId: req.user.id,
        productId: validationResult.value.productId,
        bidAmount: validationResult.value.bidAmount,
      },
    });

    return res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};
