const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { escapeHtml } = require('@hapi/hoek');

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, rePassword, agree } = req.body;

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

    // Error Handling
    if (validationResult.error) return res.status(400).json(validationResult.error);

    const userExist = await prisma.user.findFirst({
      where: {
        email: validationResult.value.email,
      },
    });
    if (userExist) return res.status(400).json({ userExist: 'Email exist' });

    // Convert password to hash
    const hashedPassword = await bcrypt.hash(validationResult.value.password, 12);

    // Create User
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

    // Validation
    const schema = Joi.object().keys({
      email: Joi.string().lowercase().email().min(3).max(254).required(),
      password: Joi.string().trim().min(8).max(128).required(),
    });
    const validationResult = schema.validate({
      email,
      password,
    });

    // Error Handling
    if (validationResult.error) return res.status(400).json(validationResult.error);

    const user = await prisma.user.findFirst({
      where: {
        id: validationResult.value.id,
        email: validationResult.value.email,
      },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        profile_image: true,
        cover_image: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        userOrPassword: 'Email or password is incorrect',
      });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return res.status(400).json({
        userOrPassword: 'Email or password is incorrect',
      });
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    const payload = {
      id: user.id,
      email: user.email,
    };
    const expireTime = { expiresIn: '14d' };
    const token = jwt.sign(payload, JWT_SECRET, expireTime);

    delete user.password;
    user.token = token;

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json();
  }
};

exports.contactUs = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
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

    // Error Handling
    if (validationResult.error) return res.status(400).json(validationResult.error);

    await prisma.contact.create({
      data: {
        name: validationResult.value.name,
        email: validationResult.value.email,
        subject: validationResult.value.subject,
        message: validationResult.value.message,
      },
    });

    res.status(201).json();
  } catch (error) {
    res.status(500).json();
  }
};

exports.newsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    const schema = Joi.object().keys({
      email: Joi.string().lowercase().email().min(3).max(254).required(),
    });
    const validationResult = schema.validate({
      email,
    });

    // Error Handling
    if (validationResult.error) return res.status(400).json(validationResult.error);

    await prisma.newsletter.create({ data: { email: validationResult.value.email } });

    res.status(201).json();
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

    // Error Handling
    if (!product) return res.status(404).json();

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json();
  }
};

exports.getRecentView = async (req, res) => {
  try {
    const { products: productsArray } = req.body;

    // Validation
    const schema = Joi.object().keys({
      productsArray: Joi.array().min(1).max(4).required().items(Joi.number()),
    });
    const validationResult = schema.validate({
      productsArray,
    });

    // Error Handling
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

    // Validation
    const schema = Joi.object().keys({
      categoryId: Joi.number().required(),
    });
    const validationResult = schema.validate({
      categoryId,
    });

    // Error Handling
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

exports.getProducts = async (req, res) => {
  try {
    const { page, sortByLeastLike, categoryId, minPrice, maxPrice } = req.body;

    const ITEM_PER_PAGE = 10;

    // Validation
    const schema = Joi.object().keys({
      page: Joi.number().required().positive(),
      sortByLeastLike: Joi.boolean().required(),
      categoryId: Joi.number().positive(),
      minPrice: Joi.number().positive(),
      maxPrice: Joi.number().positive(),
    });
    const validationResult = schema.validate({
      page,
      sortByLeastLike,
      categoryId,
      minPrice,
      maxPrice,
    });

    // Error Handling
    if (validationResult.error) return res.status(400).json(validationResult.error);

    // Filter Conditions
    let minAndMaxPriceCondition = (minPrice, maxPrice) => {
      if (minPrice && maxPrice) {
        return {
          AND: [{ bidAmount: { gte: minPrice } }, { bidAmount: { lte: maxPrice } }],
        };
      }
    };
    let sortByLeastLikeCondition = (sortByLeastLike) => {
      if (sortByLeastLike) {
        return {
          Likes: {
            _count: 'asc',
          },
        };
      }
    };

    const products = await prisma.product.findMany({
      where: {
        categoryId: validationResult.value.categoryId,
      },
      where: {
        Bids: {
          some: minAndMaxPriceCondition(minPrice, maxPrice),
        },
      },
      include: {
        Likes: true,
        Bids: { orderBy: { bidAmount: 'desc' } },
      },
      orderBy: sortByLeastLikeCondition(sortByLeastLike),
      skip: (page - 1) * ITEM_PER_PAGE,
      take: ITEM_PER_PAGE,
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json();
  }
};

exports.getProductsPrice = async (req, res) => {
  try {
    const {
      _min: { bidAmount: minPrice },
      _max: { bidAmount: maxPrice },
    } = await prisma.bids.aggregate({
      _min: { bidAmount: true },
      _max: { bidAmount: true },
    });

    res.status(200).json({ minPrice: Number(minPrice), maxPrice: Number(maxPrice) });
  } catch (error) {
    res.status(500).json();
  }
};

exports.getLiveBidding = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        expireTime: { gt: new Date() },
      },
      take: 8,
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json();
  }
};
