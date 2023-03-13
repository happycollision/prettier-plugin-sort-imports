run_spec(__dirname, ["typescript"], {
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderSeparation: true,
    importOrderSeparationGroups: ['A', 'B', 'B', 'C'],
    importOrderParserPlugins: ['typescript']
});
