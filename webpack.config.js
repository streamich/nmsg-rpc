var webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/umd'
    },
    output: {
        path: './dist',
        filename: 'nmsg-rpc.js'
    },
    resolve: {
        extensions: ['.js']
    }
};
