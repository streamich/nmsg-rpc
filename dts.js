require('dts-generator').default({
    name: 'nmsg-rpc',
    project: '.',
    out: 'nmsg-rpc.d.ts',
    excludes: [
        "node_modules/**/*.d.ts",
        "typings/**/*.d.ts",
        "typings/tsd.d.ts"
    ]
});