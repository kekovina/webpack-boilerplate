const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ImageminPlugin = require('imagemin-webpack')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const filename = ext => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`

const optimization = () => {
    const configObj = {
        splitChunks: {
            chunks: 'all',

        }
    }

    if(isProd){
        configObj.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ]
    }
    return configObj
}

const plugins = () => {
    const basePlugins = [
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            filename: 'index.html',
            minify: {
                collapseWhitespace: isProd
            }
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
          }),
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: `css/${filename('css')}`
        }),new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/img'),
                    to: path.resolve(__dirname, 'app/img')
                }
            ]
        }),
       
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
          }),
    ]

    if(isProd){
        basePlugins.push(
            new ImageminPlugin({
                bail: false, // Ignore errors on corrupted images
                cache: true,
                imageminOptions: {
                  // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them
           
                  // Lossless optimization with custom option
                  // Feel free to experiment with options for better result for you
                  plugins: [
                    ["gifsicle", { interlaced: true }],
                    ["jpegtran", { progressive: true }],
                    ["optipng", { optimizationLevel: 5 }],
                  ]
                }
              })
        )
    }

    return basePlugins
}

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: ['babel-polyfill', './js/main.js'],
    output: {
        filename: `js/${filename('js')}`,
        path: path.resolve(__dirname, 'app'),
        publicPath: '',
        clean: true,
        assetModuleFilename: filename('[ext]')
    },
    optimization: optimization(),
    plugins: plugins(),
    resolve: {},
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
                {
                    loader: 'markup-inline-loader', 
                    options: {
                        "svgo":
                        {
                          plugins: [
                            {
                              removeViewBox: false
                            }
                          ]
                        }
                    }
                }],
                
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
                test: /\.(?:|ttf)$/,
                type: "asset/resource"
            },
            {
                test: /\.js$/,
                exclude: '/node_modules/',
                use: ['babel-loader']
            },
        ]
    }
}