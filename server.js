import crypto from "node:crypto";
import express from "express";
import {
    parse,
    unparse,
    search
} from "./index.js";

const app = express();
app.use(express.json());

const sessions = new Map();
sessions.set("default", {
    l: 1024,
    s: new search(1024, 1024),
    p: new Set()
});

app.post("/create", (req, res) => {
    if (!req.body) return res.status(400).json({
        error: "missing body"
    });
    const {
        limit
    } = req.body;
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit <= 0) return res.status(400).json({
        error: "invalid limit"
    });

    const s = new search(limit, limit);
    const id = crypto.randomUUID();
    sessions.set(id, {
        l: limit,
        s: s,
        p: new Set()
    });
    return res.json({
        id
    });
});

app.post("/put", (req, res) => {
    if (!req.body) return res.status(400).json({
        error: "missing body"
    });
    const {
        lines,
        id = "default"
    } = req.body;
    const found = sessions.get(id);
    if (!found) return res.status(404).json({
        error: "search not found"
    });
    const {
        s,
        p
    } = found;

    const inputLines = Array.isArray(lines) ? lines : [lines];
    if (!inputLines.every(l => typeof l === "string")) return res.status(400).json({
        error: "invalid line(s)"
    });

    let count = 0;
    for (const line of inputLines)
        if (s.add(line)) {
            count += 1;
            p.add(unparse(parse(line)));
        }
    return res.json({
        id,
        count
    });
});

app.post("/exec", (req, res) => {
    if (!req.body) return res.status(400).json({
        error: "missing body"
    });
    const {
        id = "default"
    } = req.body;
    const found = sessions.get(id);
    if (!found) return res.status(404).json({
        error: "search not found"
    });
    const {
        s,
        p
    } = found;

    const lines = [];
    s.execute(c => {
        lines.push(c);
        p.add(c);
    });
    return res.json({
        id,
        lines
    });
});

app.post("/all", (req, res) => {
    if (!req.body) return res.status(400).json({
        error: "missing body"
    });
    const {
        id = "default"
    } = req.body;
    const found = sessions.get(id);
    if (!found) return res.status(404).json({
        error: "search not found"
    });
    const {
        s,
        p
    } = found;

    const lines = Array.from(p);
    return res.json({
        id,
        lines
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Search API running at http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
});
