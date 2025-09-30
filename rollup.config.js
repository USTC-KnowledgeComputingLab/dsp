import terser from "@rollup/plugin-terser";

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
    ]
};
