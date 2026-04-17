const nested = require('postcss-nested');
const customMedia = require('postcss-custom-media');
const csso = require('postcss-csso');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    nested,
    customMedia({
      preserve: false,
    }),
    csso({ restructure: false }),
    autoprefixer,
  ],
};
