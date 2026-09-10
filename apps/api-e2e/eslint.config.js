const baseConfig = require("../../eslint.config.js");

module.exports = [
    ...baseConfig,
    {
        files: ["**/*.ts"],
        rules: {
            // The e2e suite boots the real application in-process — the real module graph, the
            // real global pipe, filter and guards — so it must import from the app it tests.
            // Approved 2026-09-10; scoped to this project, and only to `apps/api/src`.
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?js$",
                        "^(\\.\\./)+api/src/.*$"
                    ],
                    depConstraints: [{
                            sourceTag: "*",
                            onlyDependOnLibsWithTags: ["*"]
                        }]
                }
            ]
        }
    }
];
