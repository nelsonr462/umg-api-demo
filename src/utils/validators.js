const { check } = require('express-validator');

module.exports.isrc = [
  check('isrc', 'Invalid ISRC submitted.')
    .trim()
    .isISRC()
]

module.exports.artist = [
  check('artist', 'Invalid artist name submitted.')
    .trim()
    .escape()
    .isLength({min: 1, max: 128})
]