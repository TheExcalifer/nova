module.exports = ext => {
  return `${Math.round(Math.random() * 10 ** 10)}-${Math.round(
    Math.random() * 10 ** 10
  )}.${ext}`;
};
