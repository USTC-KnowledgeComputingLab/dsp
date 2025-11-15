import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import {
    nodeResolve
} from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
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
        nodeResolve({
            exportConditions: ["node"],
        }),
        commonjs(),
        json(),
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
