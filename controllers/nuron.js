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

    res.status(201).json(createdUser);
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

exports.createNFT = async (req, res) => {
  try {
    let fileExtensionError;
    const productImagesName = [];
    // Upload Config
    const form = formidable({
      maxFiles: 3,
      maxFileSize: 1 * 200 * 1024,
      uploadDir: path.join('public', 'user', 'product'),
      filter: ({ name, originalFilename, mimetype }) => {
        if (name != 'productImages') return false;
        const fileExtension = extensionExtractor(originalFilename);
        if (fileExtension != 'png' && fileExtension && 'jpg' && fileExtension != 'jpeg') {
          fileExtensionError = true;
          return false;
        }
        return true;
      },
      filename: (name, ext, part, form) => {
        const fileExtension = extensionExtractor(part.originalFilename);
        const randomNumber = Math.round(Math.random() * 1e10);
        const newFileName = `${randomNumber}.${fileExtension}`;
        productImagesName.push({ image: newFileName });
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
        royality: Joi.number().max(99).required(),
        categoryId: Joi.number().required(),
      });

      const validationResult = schema.validate({
        productName: productName[0],
        description: description[0],
        royality: Number(royality[0]),
        categoryId: Number(categoryId[0]),
      });

      // Error handling
      const existCategory = await prisma.category.findFirst({ where: { id: validationResult.value.categoryId } });
      if (!existCategory) return res.status(400).json({ invalidCategoryId: 'Category is invalid' });

      if (validationResult.error) return res.status(400).json(validationResult.error);

      if (err?.code == 1015) return res.status(400).json({ maxFileNumber: 'Max number of file is 3' });
      if (fileExtensionError) return res.status(400).json({ allowFormat: 'Allow formats: jpeg, jpg, png' });

      const createdProduct = await prisma.product.create({
        data: {
          productName: validationResult.value.productName,
          description: validationResult.value.description,
          royality: validationResult.value.royality,
          categoryId: validationResult.value.categoryId,
          creatorId: req.user.id,
          ownerId: req.user.id,
          activeUntil: addDays(new Date(), 1),
          Product_Image: { createMany: { data: productImagesName } },
        },
      });

      res.status(200).json(createdProduct);
    });
  } catch (error) {
    res.status(500).json();
  }
};
