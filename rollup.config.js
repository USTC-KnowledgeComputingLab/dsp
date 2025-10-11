import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import {
    copy
} from "@web/rollup-plugin-copy";

export default {
    input: {
        index: "index.js",
        server: "server.js"
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
        json(),
        copy({
            patterns: ["index.d.ts"],
        }),
        copy({
            patterns: ["ds.wasm"],
            rootDir: "tsds/dist",
        }),
    ]
};
