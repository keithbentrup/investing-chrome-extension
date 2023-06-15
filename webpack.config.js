const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  //mode: 'development',
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
  entry: {
    background: './src/scripts/entry-points/background.js',
    popup: './src/scripts/entry-points/popup.js',
    // the chrome extension "content" script that injects the persistent script
    content: './src/scripts/entry-points/content-injector.js',
    // the persistent script
    localhost: './src/scripts/entry-points/localhost.js',
    injectedNavIframe: './src/scripts/entry-points/injected-nav-iframe.js',
    injectedRollResultsIframe: './src/scripts/entry-points/injected-roll-results-iframe.js',
    "ally.com": './src/scripts/entry-points/ally.js',
    "dataroma.com": './src/scripts/entry-points/dataroma.js',
    "etrade.com": './src/scripts/entry-points/etrade.js',
    "interactivebrokers.com": './src/scripts/entry-points/interactivebrokers.js',
    "google.com": './src/scripts/entry-points/google.js',
    "valueinvestorsclub.com": './src/scripts/entry-points/valueinvestorsclub.js',
    "vanguard.com": './src/scripts/entry-points/vanguard.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist') + '/scripts',
    //filename: '[name].[contenthash].js',
    filename: '[name].webpack.js',
    //clean: true
  },
  plugins: [new HtmlWebpackPlugin()],
  optimization: {
    //runtimeChunk: 'single',
    // moduleIds: 'deterministic',
    // splitChunks: {
    //   cacheGroups: {
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'vendors',
    //       chunks: 'all',
    //     },
    //   },
    // },
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        exclude: /\.lazy\.scss$/,
        use: [
          // { loader: 'style-loader', options: { injectType: 'linkTag' } },
          { loader: 'style-loader'},
          // { loader: 'file-loader', options: { name: '[path][name].[ext]' } },
          // { loader: 'file-loader', },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ]
      },
      {
        test: /\.lazy\.scss$/,
        use: [
          // { loader: 'style-loader', options: { injectType: 'linkTag' } },
          { loader: 'style-loader' , options: { injectType: "lazyStyleTag" } },
          // { loader: 'file-loader', options: { name: '[path][name].[ext]' } },
          // { loader: 'file-loader', },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ]
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      }
    ]
  }
}