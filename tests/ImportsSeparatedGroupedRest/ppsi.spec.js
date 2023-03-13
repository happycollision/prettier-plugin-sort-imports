run_spec(__dirname, ['typescript'], {
    importOrder: [
        '^@core/(.*)$',
        '^@server/(.*)',
        '^@ui/(.*)$',
        '<THIRD_PARTY_MODULES>',
        '^[./]',
    ],
    importOrderSeparation: true,
    importOrderSeparationGroups: ['A', 'B', 'B', 'B', 'C'],
    importOrderParserPlugins: ['typescript'],
});
