/**
 * @file The `webpack.config.js` takes care of all the configuration values for webpack 
 * to bundle and compile all the necessary modules. This includes bundling all the multiple 
 * js files as well as the external modules and dependencies. Once its set to production it also 
 * works as a minifier to further optimize the code and create an optimized production-ready dist folder.
 */

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        bundle: path.resolve(__dirname, 'src/scripts/main.js'),
        styles: path.resolve(__dirname, 'src/styles/styles.css'),
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name][contenthash].js',
        clean: true,
        assetModuleFilename: '[name][ext]',
    },
    devtool: 'source-map',
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist')
        },
        port: 3000,
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
                type: 'asset/resource'
            },
            {
                test:/\.scss$/,
                use: ['style-loader','css-loader','sass-loader'],
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
			{
				test: /\.ttf$/,
				type: 'asset/resource'
			},
            {
                test: /\.json$/,
                use: 'json-loader',
                type: 'javascript/auto', // Necessary for Webpack 5
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Webpack App',
            filename: 'index.html',
            template: 'src/template.html',
            favicon: 'src/assets/favicon/favicon.ico'
        }),
        // new BundleAnalyzerPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './src/assets/favicon',
                    to: 'favicon',
                },
                {
                    from: './src/examples-paths',
                    to: 'examples-paths',
                },
            ],
        }),
        new MonacoWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        })
    ],
    optimization: {
        minimizer: [
            new CssMinimizerPlugin(),
        ]
    }
}