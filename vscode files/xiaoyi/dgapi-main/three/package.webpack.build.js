var path = require('path');

module.exports = {
    entry: {
        index: './index.ts'
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['ts-loader']
            }
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "./dict"),
        },
        hot: true, //启用模块热替换
        host: "localhost", //设置host
        port: 8005, //设置端口号
        open: true, //自动打开浏览器
        compress: true, //将静态资源进行gzip压缩
    }
};