/* eslint import/no-extraneous-dependencies: "off" */
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const config = {
  mode: 'production',
  optimization: {
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()]
  },
  plugins: [
    new ImageminPlugin()
  ]
};

module.exports = config;
