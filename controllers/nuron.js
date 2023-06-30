const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
