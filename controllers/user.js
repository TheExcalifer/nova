const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { escapeHtml } = require('@hapi/hoek');
const addDays = require('../utility/add-days');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const arvanS3 = require('../utility/arvan-s3');
const nameGenerator = require('../utility/name-generator');
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
    const {
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
    } = req.body;

    // Validation
    const schema = Joi.object().keys({
      firstName: Joi.string()
        .trim()
        .min(3)
        .max(64)
        .required()
        .custom(value => escapeHtml(value)),
      lastName: Joi.string()
        .trim()
        .min(3)
        .max(64)
        .required()
        .custom(value => escapeHtml(value)),
      email: Joi.string().lowercase().email().min(3).max(254).required(),
      bio: Joi.string()
        .trim()
        .min(0)
        .max(256)
        .required()
        .custom(value => escapeHtml(value)),
      role: Joi.string()
        .trim()
        .min(0)
        .max(64)
        .required()
        .custom(value => escapeHtml(value)),
      gender: Joi.string()
        .trim()
        .required()
        .valid('Female', 'Male', 'Third Gender'),
      currency: Joi.string()
        .trim()
        .valid('($)USD', 'wETH', 'BIT Coin')
        .required()
        .custom(value => escapeHtml(value)),
      phoneNumber: Joi.string()
        .trim()
        .min(10)
        .max(16)
        .required()
        .pattern(/^\+\d+$/),
      location: Joi.string()
        .min(0)
        .max(32)
        .valid('United State', 'KATAR', 'Canada')
        .required(),
      address: Joi.string()
        .min(0)
        .max(128)
        .required()
        .custom(value => escapeHtml(value)),
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

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    if (req.user.email != validationResult.value.email) {
      const userExist = await prisma.user.findFirst({
        where: { email: validationResult.value.email },
      });
      if (userExist) return res.status(400).json({ userExist: 'Email exist' });
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
      select: {
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        gender: true,
        currency: true,
        phone_number: true,
        location: true,
        address: true,
        bio: true,
      },
    });

    // Update user email in request
    req.user.email = email;

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json();
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, password, rePassword } = req.body;

    // Validation
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

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    const { password: currentPasswordInDatabase } = await prisma.user.findFirst(
      {
        where: {
          email: req.user.email,
        },
        select: { password: true },
      }
    );

    const isCorrectCurrentPassword = await bcrypt.compare(
      validationResult.value.oldPassword,
      currentPasswordInDatabase
    );
    if (!isCorrectCurrentPassword)
      res
        .status(400)
        .json({ incorrectPassword: 'your old password is incorrect' });

    // Convert new password to hash
    const hashedPassword = await bcrypt.hash(
      validationResult.value.password,
      12
    );

    await prisma.user.update({
      where: { email: req.user.email },
      data: { password: hashedPassword },
    });

    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id },
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
    if (!user) return res.status(404).json();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json();
  }
};

exports.createNFT = async (req, res) => {
  try {
    // Validation
    const schema = Joi.object().keys({
      productName: Joi.string()
        .trim()
        .required()
        .custom(value => escapeHtml(value)),
      description: Joi.string()
        .trim()
        .required()
        .custom(value => escapeHtml(value)),
      royality: Joi.number().min(0).max(99).required(),
      categoryId: Joi.number().required(),
    });
    const validationResult = schema.validate({
      ...req.body,
    });

    // Validation Error
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    const existCategory = await prisma.category.findFirst({
      where: { id: validationResult.value.categoryId },
    });
    if (!existCategory)
      return res.status(400).json({ invalidCategoryId: 'Category is invalid' });

    const productImages = req.files;
    // Error Handling
    if (productImages.length < 3)
      return res.status(400).json({ error: 'Send at least 1 image' });

    const arvanS3Promises = [];
    const productImagesPaths = [];
    for (const productImage of productImages) {
      const productSizeInMB = productImage.size / 1024 / 1024;

      if (productSizeInMB > 0.2) {
        res.status(400).json({ error: 'Maximum file size is 200kb' });
        break;
      }

      //  example: name.jpg => jpg
      const imageExtension = productImage.originalname.split('.').at(-1);

      // Arvan S3 Options
      const uploadParams = {
        Bucket: process.env.BUCKET_NAME, // bucket name
        Key: nameGenerator(imageExtension), // the name of the selected file
        ACL: 'public-read', // 'private' | 'public-read'
        Body: productImage.buffer,
      };
      productImagesPaths.push({
        image: process.env.BUCKET_ADDRESS + uploadParams.Key,
      });
      arvanS3Promises.push(arvanS3.send(new PutObjectCommand(uploadParams)));
    }
    try {
      await Promise.all(arvanS3Promises);
    } catch (err) {
      throw new Error();
    }
    const createdProduct = await prisma.product.create({
      data: {
        productName: validationResult.value.productName,
        description: validationResult.value.description,
        royality: validationResult.value.royality,
        categoryId: validationResult.value.categoryId,
        creatorId: req.user.id,
        ownerId: req.user.id,
        expireTime: addDays(new Date(), 1),
        Product_Image: { createMany: { data: [...productImagesPaths] } },
      },
      include: {
        Product_Image: true,
        category: true,
      },
    });
    res.status(201).json(createdProduct);
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

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    // Preventing duplicate "like" a product from same user
    const likedBefore = await prisma.likes.findFirst({
      where: {
        userId: req.user.id,
        productId: validationResult.value.productId,
      },
    });
    if (likedBefore)
      return res.status(400).json({ twiceLike: 'You liked this post already' });

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

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    await prisma.likes.deleteMany({
      where: {
        userId: req.user.id,
        productId: validationResult.value.productId,
      },
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
        .custom(value => Number(value.toFixed(2))),
      bidAmount: Joi.number()
        .positive()
        .required()
        .custom(value => Number(value.toFixed(2))),
    });
    const validationResult = schema.validate({
      productId,
      bidAmount,
    });

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    // Get user balance
    const { balance: userBalance } = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
      select: {
        balance: true,
      },
    });

    // Get total user bids amount
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

    // If the user has active bids, the money amount of those offers will be locked
    const userAvailableMoney = userBalance - totalUserActiveBidsAmount;
    if (userAvailableMoney < validationResult.value.bidAmount)
      return res
        .status(400)
        .json({ notEnoughMoney: 'Your available balance is not enough' });

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
    // Checking bid's expire time
    if (product.expireTime < Date.now())
      return res.status(400).json({ expireTime: 'bid time has ended' });

    // Getting highest bid amount for this product from other users
    const { bidAmount: highestBidAmount } =
      product.Bids.at(0) ?? Number.NEGATIVE_INFINITY;

    if (validationResult.value.bidAmount <= highestBidAmount)
      return res
        .status(400)
        .json({ notEnoughBid: 'Your bid amount is not enough' });

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

exports.follow = async (req, res) => {
  try {
    const userId = req.body.userId;
    // Validation
    const schema = Joi.object().keys({
      userId: Joi.number().positive().required(),
    });
    const validationResult = schema.validate({
      userId,
    });

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    // Preventing follow yourself
    if (req.user.id == userId)
      return res
        .status(400)
        .json({ followYourself: 'You can not follow yourself' });

    // Preventing like someone twice
    const duplicateFollow = await prisma.following.findFirst({
      where: {
        userId: req.user.id,
        followingUserId: validationResult.value.userId,
      },
    });
    if (duplicateFollow)
      return res
        .status(400)
        .json({ duplicateFollow: 'You have been follow this user' });

    // Success Follow
    await prisma.following.create({
      data: {
        userId: req.user.id,
        followingUserId: validationResult.value.userId,
      },
    });

    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.unfollow = async (req, res) => {
  try {
    const userId = req.body.userId;
    // Validation
    const schema = Joi.object().keys({
      userId: Joi.number().positive().required(),
    });
    const validationResult = schema.validate({
      userId,
    });

    // Error Handling
    if (validationResult.error)
      return res.status(400).json(validationResult.error);

    // Success Unfollow
    await prisma.following.deleteMany({
      where: {
        userId: req.user.id,
        followingUserId: validationResult.value.userId,
      },
    });

    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true,
        owner: { include: { Bids: true } },
        Likes: { include: { product: { include: { Bids: true } } } },
        creator: { include: { Bids: true } },
        _count: { select: { follower: true, following: true } },
      },
    });
    // Error Handling
    if (!user) return res.status(404).json();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json();
  }
};

exports.followStatus = async (req, res) => {
  try {
    const userId = Number(req.body.userId);
    const followStatus = await prisma.following.findFirst({
      where: { userId: req.user.id, followingUserId: userId },
    });
    // Error Handling
    if (!followStatus) res.status(404).json();
    res.status(200).json(followStatus);
  } catch (error) {
    res.status(500).json();
  }
};
