const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude native android directory and gradle caches from Metro watcher
config.resolver.blockList = [
  /.*\/android\/.*/,
  /.*\.gradle\/.*/,
];

module.exports = config;

