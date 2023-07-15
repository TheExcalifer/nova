const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const extensionExtractor = require('../utility/extension-extractor');
const jwt = require('jsonwebtoken');
const { formidable, errors: formidableErrors } = require('formidable');
const Joi = require('joi');
const { escapeHtml } = require('@hapi/hoek');
const addDays = require('../utility/add-days');
const path = require('path');

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, rePassword, agree } = req.body;

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
      agree: Joi.bool().valid(true).required(),
    });

    const validationResult = schema.validate({
      firstName,
      lastName,
      email,
      password,
      rePassword,
      agree,
    });

    if (validationResult.error) return res.status(400).json(validationResult.error);
    const userExist = await prisma.user.findFirst({
      where: {
        email: validationResult.value.email,
      },
    });
    if (userExist) return res.status(400).json({ userExist: 'Email exist' });

    const hashedPassword = await bcrypt.hash(validationResult.value.password, 12);

    const createdUser = await prisma.user.create({
      data: {
        first_name: validationResult.value.firstName,
        last_name: validationResult.value.lastName,
        email: validationResult.value.email,
        password: hashedPassword,
      },
    });

    res.status(201).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const schema = Joi.object().keys({
      email: Joi.string().lowercase().email().min(3).max(254).required(),
      password: Joi.string().trim().min(8).max(128).required(),
    });

    const validationResult = schema.validate({
      email,
      password,
    });

    if (validationResult.error) return res.status(400).json(validationResult.error);

    const user = await prisma.user.findFirst({
      where: {
        email: validationResult.value.email,
      },
    });
    if (!user)
      return res.status(400).json({
        userOrPassword: 'Email or password is incorrect',
      });

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword)
      return res.status(400).json({
        userOrPassword: 'Email or password is incorrect',
      });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      '4LZpJPii2NW4NFJxTwueL76XnqZPn4Qr',
      { expiresIn: '6h' }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json();
  }
};

exports.contactUs = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const schema = Joi.object().keys({
      name: Joi.string()
        .min(3)
        .max(128)
        .required()
        .custom((value) => escapeHtml(value)),
      email: Joi.string().lowercase().email().min(3).max(254).required(),
      subject: Joi.string()
        .min(10)
        .max(64)
        .required()
        .custom((value) => escapeHtml(value)),
      message: Joi.string()
        .min(10)
        .max(300)
        .required()
        .custom((value) => escapeHtml(value)),
    });

    const validationResult = schema.validate({
      name,
      email,
      subject,
      message,
    });

    if (validationResult.error) return res.status(400).json(validationResult.error);

    const createdMessage = await prisma.contact.create({
      data: {
        name: validationResult.value.name,
        email: validationResult.value.email,
        subject: validationResult.value.subject,
        message: validationResult.value.message,
      },
    });

    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.newsletter = async (req, res) => {
  try {
    const { email } = req.body;

    const schema = Joi.object().keys({
      email: Joi.string().lowercase().email().min(3).max(254).required(),
    });

    const validationResult = schema.validate({
      email,
    });

    if (validationResult.error) return res.status(400).json(validationResult.error);

    await prisma.newsletter.create({ data: { email: validationResult.value.email } });
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json();
  }
};

exports.getProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
      },
      include: {
        Product_Image: {
          select: {
            image: true,
          },
        },
        Likes: true,
        category: true,
        Bids: true,
        owner: { select: { id: true, first_name: true } },
        creator: {
          select: {
            id: true,
            first_name: true,
          },
        },
      },
    });
    if (!product) return res.status(404).json();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json();
  }
};
exports.getRecentView = async (req, res) => {
  try {
    const { products: productsArray } = req.body;
    const schema = Joi.object().keys({
      productsArray: Joi.array().min(1).max(4).required().items(Joi.number()),
    });
    const validationResult = schema.validate({
      productsArray,
    });
    if (validationResult.error) return res.status(400).json(validationResult.error);

    const products = await prisma.product.findMany({
      where: {
        id: { in: validationResult.value.productsArray },
      },
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json();
  }
};
exports.getRelatedProductByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const schema = Joi.object().keys({
      categoryId: Joi.number().required(),
    });
    const validationResult = schema.validate({
      categoryId,
    });
    if (validationResult.error) return res.status(400).json(validationResult.error);

    const products = await prisma.product.findMany({
      where: {
        categoryId: validationResult.value.categoryId,
      },
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json();
  }
};
