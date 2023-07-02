const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validationResult } = require('express-validator');
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
    const { firstName, lastName, email, password } = req.body;

    const validationErrors = validationResult(req).errors;
    if (validationErrors.length != 0) return res.status(400).json({ errors: { validationErrors } });

    const userExist = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (userExist) return res.status(400).json({ errors: { userExist: true } });

    const hashedPassword = await bcrypt.hash(password, 12);

    const createdUser = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
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
    const validationErrors = validationResult(req).errors;
    if (validationErrors.length != 0) return res.status(400).json({ errors: { validationErrors } });

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user)
      return res.status(400).json({
        errors: { userOrPassword: 'Email or password is incorrect' },
      });

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword)
      return res.status(400).json({
        errors: { userOrPassword: 'Email or password is incorrect' },
      });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      '4LZpJPii2NW4NFJxTwueL76XnqZPn4Qr',
      { expiresIn: '1h' }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json();
  }
};

exports.contactUs = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const validationErrors = validationResult(req).errors;
    if (validationErrors.length != 0) return res.status(400).json({ errors: { validationErrors } });

    const createdMessage = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
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

    const validationErrors = validationResult(req).errors;
    if (validationErrors.length != 0) return res.status(400).json({ errors: { validationErrors } });

    await prisma.newsletter.create({ data: { email: email } });
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
          .custom((value) => escapeHtml(value)),
        description: Joi.string()
          .trim()
          .custom((value) => escapeHtml(value)),
        royality: Joi.number().max(99),
        categoryId: Joi.number(),
      });

      const validationResult = schema.validate({
        productName: productName[0],
        description: description[0],
        royality: Number(royality[0]),
        categoryId: Number(categoryId[0]),
      });

      // Error handling
      const existCategory = await prisma.category.findFirst({ where: { id: validationResult.value.categoryId } });
      if (!existCategory) return res.status(400).json({ errors: { invalidCategoryId: true } });

      if (validationResult.error)
        return res.status(400).json({ errors: { validationResult: validationResult.error.details } });

      if (err?.code == 1015) return res.status(400).json({ errors: { maxFileNumber: true } });
      if (fileExtensionError) return res.status(400).json({ errors: { allowFormat: true } });

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
