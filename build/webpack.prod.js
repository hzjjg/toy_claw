const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const common = require('./webpack.common');
const {resolve} = require('./utils');

module.exports = merge(common, {
    mode: 'production',
    
    optimization: {
        minimizer: [
          new UglifyJsPlugin({
            cache: true,
            parallel: true,
            sourceMap: false
          }),
          new OptimizeCSSAssetsPlugin({})
        ]
      },

    plugins:[
        new CleanWebpackPlugin(['dist'],{
            root:resolve('/')
        }),
    ]
})