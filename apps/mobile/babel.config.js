module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: 'nativewind' instrui o Babel a usar o JSX transform do
      // NativeWind, habilitando as props `className` em todos os componentes RN.
      // NÃO adicione 'nativewind/babel' em plugins — ele é um preset, não um plugin,
      // e causaria o erro ".plugins is not a valid Plugin property".
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    // Reanimated v4 (worklets via react-native-worklets) não precisa de plugin manual.
    // Se no futuro useAnimatedStyle/useAnimatedProps falharem, adicione aqui:
    // plugins: ['react-native-reanimated/plugin'],  // SEMPRE o último item
  };
};
