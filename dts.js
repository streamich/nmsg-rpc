require('dts-generator').default({
    project: '.',
    out: 'nmsg-rpc.d.ts',
    excludes: [
        "umd.ts",
        "node_modules/**/*.d.ts",
        "typings/**/*.d.ts",
        "typings/tsd.d.ts"
    ]
});