import readline from "node:readline";
import {
    parse,
    unparse
} from "./index.js";


if (process.argv[2] === "parse") {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    rl.on("line", (line) => {
        const result = parse(line);
        if (result !== undefined) {
            console.log(result);
        }
    });
} else if (process.argv[2] === "unparse") {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    let buffer = [];
    rl.on("line", (line) => {
        if (line.trim() === "") {
            if (buffer.length > 0) {
                const block = buffer.join("\n");
                const result = unparse(block);
                if (result !== undefined) {
                    console.log(result);
                }
                buffer = [];
            }
        } else {
            buffer.push(line);
        }
    });

    rl.on("close", () => {
        if (buffer.length > 0) {
            const block = buffer.join("\n");
            const result = unparse(block);
            if (result !== undefined) {
                console.log(result);
            }
        }
    });
} else {
    console.error("Usage: node script.js [parse|unparse]");
    process.exit(1);
}
