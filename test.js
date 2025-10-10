import readline from "node:readline";
import {
    search
} from "./index.js";

const l = parseInt(process.argv[2], 10);
const s = new search(l, l);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});


rl.on("line", (line) => {
    if (s.add(line)) {
        while (s.execute(c => console.log(c)));
    }
});
