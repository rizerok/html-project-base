// eslint-disable-next-line import/no-extraneous-dependencies
const { HotModuleReplacementPlugin } = require('webpack');
// eslint-disable-next-line import/no-extraneous-dependencies
const HtmlWebpackPlugin = require('html-webpack-plugin');

let devServer;

function htmlReloadPlugin() {
  const cache = {};
  const current = {};
  const plugin = { name: 'CustomHtmlReloadPlugin' };
  this.hooks.compilation.tap(plugin, compilation => {
    const hooks = HtmlWebpackPlugin.getHooks(compilation);
    hooks.beforeEmit.tap(plugin, data => {
      const { html } = data;
      current[data.outputName] = html;
    });
    hooks.afterEmit.tap(plugin, data => {
      const orig = cache[data.outputName];
      if (orig && orig !== current[data.outputName]) {
        devServer.sendMessage(devServer.webSocketServer.clients, 'content-changed');
      }
      cache[data.outputName] = current[data.outputName];
    });
  });
}

const config = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    onBeforeSetupMiddleware(server) {
      devServer = server;
    },
    // webpack watched this static paths. And if devMiddleware publicPath and this path
    // is equal hmr will not work. The entire page will always be updated
    static: false,
    open: true,
    port: 8000,
    devMiddleware: {
      index: true,
      writeToDisk: true
      // publicPath: './public'
    }
  },
  plugins: [
    new HotModuleReplacementPlugin(),
    htmlReloadPlugin
  ]
};

module.exports = config;
