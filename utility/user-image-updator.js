const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const extensionExtractor = require('./extension-extractor');
const path = require('path');
const { formidable, errors: formidableErrors } = require('formidable');
const { unlink } = require('fs').promises;
// TODO Refactor needed
module.exports = async (req, res, uplodaDir, imageKeyName, dbColumnName) => {
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
    maxFileSize: 1 * 1024 * 1024,
    uploadDir: path.join('public', 'user', uplodaDir),
    maxFiles: 1,
    filter: ({ name, originalFilename, mimetype }) => {
      if (name != imageKeyName) return false;
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
      return `${randomNumber}.${fileExtension}`;
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (err?.code == formidableErrors.biggerThanTotalMaxFileSize) {
      return res.status(400).json();
    }
    if (fileExtensionError) return res.status(400).json();
    await prisma.user.update({
      where: {
        email: req.user.email,
      },
      data: {
        [dbColumnName]: files[imageKeyName][0].newFilename,
      },
    });
    if (previousImages[dbColumnName])
      await unlink(path.join('public', 'user', uplodaDir, previousImages[dbColumnName]));
      
    res.status(200).json();
  });
};
