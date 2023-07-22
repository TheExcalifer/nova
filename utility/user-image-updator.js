const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const extensionExtractor = require('./extension-extractor');
const path = require('path');
const { formidable, errors: formidableErrors } = require('formidable');
const { unlink } = require('fs').promises;
// TODO Refactor needed
module.exports = async (req, res, uplodaDir, imageKeyName, dbColumnName) => {
  let imagePath = '/user/cover/';
  if (uplodaDir === 'profile') imagePath = '/user/profile/';
  const previousImages = await prisma.user.findFirst({
    where: {
      email: req.user.email,
    },
    select: {
      profile_image: true,
      cover_image: true,
    },
  });
  let fileExtensionError;
  const form = formidable({
    maxFileSize: 1 * 200 * 1024,
    uploadDir: path.join('public', 'user', uplodaDir),
    maxFiles: 1,
    filter: ({ name, originalFilename, mimetype }) => {
      if (name != imageKeyName) return false;
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
      return `${randomNumber}.${fileExtension}`;
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (files[imageKeyName]?.length != 1) return res.status(400).json({ invalidTotalFiles: 'You must send one file' });

    if (err?.code == formidableErrors.biggerThanTotalMaxFileSize) {
      return res.status(400).json({ maxSize: 'Max file size is 200kb' });
    }
    if (fileExtensionError) return res.status(400).json({ allowFormat: 'Allow formats: jpeg, jpg, png' });
    await prisma.user.update({
      where: {
        email: req.user.email,
      },
      data: {
        [dbColumnName]: imagePath + files[imageKeyName][0].newFilename,
      },
    });
    if (previousImages[dbColumnName]) await unlink(path.join('public', ...previousImages[dbColumnName].split('/')));

    res.status(200).json();
  });
};
