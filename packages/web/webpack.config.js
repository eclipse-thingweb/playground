/* 
 *  Copyright (c) 2023 Contributors to the Eclipse Foundation
 *  
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *  
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *  
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

/**
 * @file The `webpack.config.js` takes care of all the configuration values for webpack 
 * to bundle and compile all the necessary modules. This includes bundling all the multiple 
 * js files as well as the external modules and dependencies. Once its set to production it also 
 * works as a minifier to further optimize the code and create an optimized production-ready dist folder.
 */

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {

    const isDevMode = argv.mode === "development"

    const config = {
        entry: {
            bundle: path.resolve(__dirname, 'src/scripts/main.js'),
            styles: path.resolve(__dirname, 'src/styles/styles.scss'),
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name][contenthash].js',
            clean: true,
            assetModuleFilename: '[name][ext]',
        },
        devtool: isDevMode ? 'source-map' : false,
        devServer: isDevMode ? 
        {
            static: {
                directory: path.resolve(__dirname, 'dist')
            },
            port: 3000,
            open: true,
            hot: false,
            compress: true,
            historyApiFallback: true,
        } 
        : {},
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
                    type: 'asset/resource',
                },
                {
                    test: /\.scss$/,
                    use: [
                        isDevMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                    ],
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
                favicon: 'src/assets/favicon/favicon.ico',
            }),
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
                filename: isDevMode ? '[name].css' : '[name].[contenthash].css',
            }),
        ],
        optimization: {
            minimizer: [
                new CssMinimizerPlugin(),
            ]
        }
    }

    return config
}