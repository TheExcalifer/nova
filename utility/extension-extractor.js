module.exports = (fileName) => {
  const fileNameArray = fileName.split('.');
  const latestIndex = fileNameArray.length - 1;
  return fileNameArray[latestIndex];
};
