import terser from "@rollup/plugin-terser";
import { copy } from "@web/rollup-plugin-copy";

export default {
    input: {
        index: "index.js",
        main: "main.js"
    },
    output: {
        dir: "dist",
        format: "es",
        sourcemap: true
    },
    plugins: [
        terser(),
        copy({
            patterns: ["index.d.ts"],
        }),
    ]
};
