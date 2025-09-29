import terser from "@rollup/plugin-terser";

export default {
    input: "index.js",
    output: {
        file: "dist/dsp.js",
        format: "esm",
        sourcemap: true
    },
    external: ["antlr4"],
    plugins: [
        terser(),
    ]
};
