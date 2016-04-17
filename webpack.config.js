var webpack = require('webpack');

module.exports = {
    entry: {
        app: './umd'
    },
    output: {
        path: './dist',
        filename: 'nmsg-rpc.js'
    },
    resolve: {
        extensions: ['.js']
    }
};
