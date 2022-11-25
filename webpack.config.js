const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ImageminPlugin = require('imagemin-webpack')
const glob = require('glob')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const filename = ext => isDev ? `[name]${ext}` : `[name].[contenthash]${ext}`

const PAGES = ['index']

let multipleHtmlPlugins = PAGES.map(name => {
    return new HTMLWebpackPlugin({
        template: `./${name}.pug`, // relative path to the HTML files
        filename: `${name}.html`, // output HTML files
        chunks: [`${name}`], // respective JS files
        minify: {
            collapseWhitespace: isProd
        }
    })
});

const optimization = () => {
    const configObj = {
        splitChunks: {
            chunks: 'all',
        }
    }

    if(isProd){
        configObj.minimizer = [
            new TerserWebpackPlugin()
        ]
    }
    return configObj
}

const plugins = () => {
    const basePlugins = [
        ...multipleHtmlPlugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: `css/${filename('.css')}`
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/img'),
                    to: `img/${filename('[ext]')}`,
                    toType: 'template'
                },
            ]
        }),

        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),

    ]

    if(isProd){
        basePlugins.push(
            // new ImageminPlugin({
            //     bail: false, // Ignore errors on corrupted images
            //     cache: true,
            //     imageminOptions: {
            //         // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them
            //
            //         // Lossless optimization with custom option
            //         // Feel free to experiment with options for better result for you
            //         plugins: [
            //             ["gifsicle", { interlaced: true }],
            //             ["jpegtran", { progressive: true }],
            //             ["optipng", { optimizationLevel: 5 }],
            //         ]
            //     }
            // })
        )
    }

    return basePlugins
}

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: isDev ? 'development' : 'production',
    entry: {
        index: ['babel-polyfill', './js/main.js'],
        pools: ['babel-polyfill', './js/main.js']
    },
    output: {
        filename: `js/${filename('.js')}`,
        path: path.resolve(__dirname, 'app'),
        publicPath: '',
        clean: true,
        assetModuleFilename: `${filename('[ext]')}`
    },
    optimization: optimization(),
    plugins: plugins(),
    resolve: {
        fallback: {
            os: require.resolve("os-browserify/browser"),
            https: require.resolve("https-browserify"),
            http: require.resolve("stream-http"),
            stream: require.resolve("stream-browserify"),
            util: require.resolve("util/"),
            buffer: require.resolve("buffer"),
            crypto: require.resolve("crypto-browserify")
        }
    },
    devServer: {
        historyApiFallback: true,
        static: path.resolve(__dirname, 'app'),
        open: true,
        hot: true,
        port: 3000,
        compress: true
    },
    devtool: isProd ? false : 'source-map',
    module: {
        rules: [
            {
                test: /\.html$/i,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            sources: false
                        }
                    },
                ],

            },
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader',
                generator : {
                    filename : `img/${filename('[ext]')}`,
                }
            },

            {
                test      : /\.(png|jpe?g|gif)$/i,
                type      : 'asset/resource',
                generator : {
                    filename : `img/${filename('[ext]')}`,
                }
            },
            {
                test      : /\.(woff2?|ttf|eot)(\?v=\w+)?$/,
                type      : 'asset/resource',
                generator : {
                    filename : `fonts/${filename('[ext]')}`,
                }
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    },
                    'css-loader']
            },
            {
                test: /\.s[ac]ss$/i,
                use: [  {
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        publicPath: (resourcePath, context) => {
                            return path.relative(path.dirname(resourcePath), context) + '/'
                        }
                    }
                },
                    'css-loader',
                    'sass-loader']
            },
            {
                test: /\.js$/,
                exclude: '/node_modules/',
                use: ['babel-loader']
            },
            {
                test: /\.pug$/,
                loader: '@webdiscus/pug-loader',
                exclude: /(node_modules|bower_components)/
            }
        ]
    }
}