module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeUnknownsAndDefaults: false,
          removeUselessStrokeAndFill: false,
          removeViewBox: false
        }
      }
    }
  ]
};