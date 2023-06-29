const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const extensionExtractor = require('../utility/extension-extractor');
const { formidable, errors: formidableErrors } = require('formidable');
// TODO You can refactor file upload
exports.editProfileImage = async (req, res) => {
  try {
    let fileExtensionError;
    const form = formidable({
      maxFileSize: 1 * 1024 * 1024,
      uploadDir: path.join('public', 'user'),
      maxFiles: 1,
      filter: ({ name, originalFilename, mimetype }) => {
        if (name != 'profileImage') return false;
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

    form.parse(req, (err, fields, files) => {
      if (err?.code == formidableErrors.biggerThanTotalMaxFileSize) {
        return res.status(500).json({ msg: 'Maximum file size is 200kb' });
      }
      if (fileExtensionError) return res.status(500).json({ msg: 'Allow formats png, jpg, jpeg' });

      res.status(200).json({ msg: 'your image uploaded!' });
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error occured' });
  }
};
