module.exports = (date, days) => {
  date.setDate(date.getDate() + days);
  return date;
};
