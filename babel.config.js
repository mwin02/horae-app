module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-async-generator-functions',
      // The @formatjs Intl polyfills (lib/i18n/intl-polyfills.ts) ship
      // `static {}` class blocks, which Hermes' Babel pipeline can't parse.
      '@babel/plugin-transform-class-static-block',
    ],
  };
};
