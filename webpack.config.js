const { resolve } = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let devServer;

function htmlReloadPlugin() {
    const cache = {};
    const plugin = {name: 'CustomHtmlReloadPlugin'};
    this.hooks.compilation.tap(plugin, compilation => {
        compilation.hooks.htmlWebpackPluginAfterEmit.tap(plugin, data => {
            const orig = cache[data.outputName];
            const html = data.html.source();
            // plugin seems to emit on any unrelated change?
            if (orig && orig !== html) {
                devServer.sockWrite(devServer.sockets, 'content-changed');
            }
            cache[data.outputName] = html;
        });
    });
}

const config = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: "index.dist.js",
        path: resolve('public')
    },
    resolve: {
        alias: {
            styles: resolve('src','assets','styles'),
            img:resolve('src','assets','images')
        }
    },
    devtool: 'inline-source-map',
    devServer: {
        before(app, server) {
            devServer = server;
        },
        // open: true,
        port: 8000,
        contentBase: './public',
        writeToDisk: true,
        index: 'index.html',
        hot: true
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                include: resolve('src', 'assets', 'styles'),
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            importLoaders: 2,
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true,
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                include: resolve('src', 'assets', 'images'),
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.pug$/,
                use: [
                    'pug-loader'
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: 'index.pug'
        }),
        // new webpack.HotModuleReplacementPlugin()
        htmlReloadPlugin
    ]
};

module.exports = config;