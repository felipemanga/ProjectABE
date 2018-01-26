module.exports = function doubler(start, n) {
  var i = 0;
  while (i++ < n) {
    start = start * 2;
  }
  return start;
};
