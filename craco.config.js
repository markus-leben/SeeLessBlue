module.exports = {
  webpack: {
      configure: (webpackConfig, {env, paths}) => {
          return {
              ...webpackConfig,
              entry: {
                  main: [env === 'development' && require.resolve('react-dev-utils/webpackHotDevClient'),paths.appIndexJs].filter(Boolean),
                  handleTweets: './src/scripts/handleTweets.js',
                  background: './src/scripts/background.js',
              },
              output: {
                  ...webpackConfig.output,
                  filename: 'static/scripts/[name].js',
              },
              optimization: {
                  ...webpackConfig.optimization,
                  runtimeChunk: false,
              }
          }
      },
  }
}