import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { copy } from "@web/rollup-plugin-copy";

export default {
    input: {
        index: "index.js",
        main: "main.js",
        test: "test.js"
    },
    output: {
        dir: "dist",
        format: "es",
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs(),
        terser(),
        copy({
            patterns: ["index.d.ts"],
        }),
        copy({
            patterns: ["ds.wasm"],
            rootDir: "tsds/dist",
        }),
    ]
};
