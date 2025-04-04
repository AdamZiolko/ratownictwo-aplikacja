const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

// Pobierz domyślną konfigurację Expo
const config = getDefaultConfig(__dirname);

// Konfiguracja dla Windows
if (process.env.RN_PLATFORM === 'windows') {
  const rnwPath = path.dirname(require.resolve('react-native-windows/package.json'));
  
  config.resolver = {
    ...config.resolver,
    platforms: ['windows', 'native'],
    blockList: exclusionList([
      new RegExp(`${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`),
      new RegExp(`${rnwPath}/build/.*`),
      new RegExp(`${rnwPath}/target/.*`),
      /.*\.ProjectImports\.zip/,
    ]),
    extraNodeModules: {
      ...config.resolver.extraNodeModules,
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  };

  config.watchFolders = [
    ...config.watchFolders,
    path.resolve(rnwPath),
  ];
}

// Konfiguracja assetów (dla obu platform)
config.resolver.assetExts = [...config.resolver.assetExts, 'db']; 

module.exports = config;