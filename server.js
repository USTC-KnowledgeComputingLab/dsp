import {
    access,
    readFile,
    writeFile
} from "node:fs/promises";
import crypto from "node:crypto";
import express from "express";
import {
    body,
    param,
    validationResult
} from "express-validator";
import cors from "cors";
import {
    search
} from "./index.js";
import swaggerSpec from "./swagger.json";

const SAVE_INTERVAL = process.env.SAVE_INTERVAL ? parseInt(process.env.SAVE_INTERVAL) : 1;
const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || `http://${HOST}:${PORT}`;
swaggerSpec.servers = [{
    url: URL,
    description: "The development server"
}];

const app = express();

app.use(cors());

app.use(express.json());

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) return res.status(400).json({
        status: "error",
        error: "invalid JSON format in request body"
    });
    return next();
});

app.get('/swagger.json', (req, res) => {
    return res.status(200).json(swaggerSpec);
});

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({
        status: "error",
        error: errors.array()[0].msg
    });
    return next();
};

const sessions = new Map();

app.get("/health",
    (req, res) => {
        return res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
        });
    });

app.post("/sessions",
    body("limit").isInt({
        min: 1
    }).withMessage("limit must be a positive integer"),
    handleValidationErrors,
    (req, res) => {
        const {
            limit
        } = req.body;
        const id = crypto.randomUUID();
        const handle = new search(limit, limit);
        const lines = new Set();
        sessions.set(id, {
            limit,
            handle,
            lines
        });
        return res.status(200).json({
            status: "ok",
            id
        });
    });

app.get("/sessions",
    (req, res) => {
        return res.status(200).json({
            status: "ok",
            sessions: Array.from(sessions.entries()).map(([id, data]) => ({
                id,
                limit: data.limit,
                size: data.lines.size
            }))
        });
    });

app.delete("/sessions/:id",
    param("id").isUUID().withMessage("id must be a valid UUID"),
    handleValidationErrors,
    (req, res) => {
        const {
            id
        } = req.params;
        if (!sessions.has(id)) return res.status(400).json({
            status: "error",
            error: "session not found"
        });

        sessions.delete(id);
        return res.status(200).json({
            status: "ok"
        });
    });

app.post("/sessions/:id/lines",
    param("id").isUUID().withMessage("id must be a valid UUID"),
    body().isArray().withMessage("request body must be an array"),
    body("*").isString().withMessage("each item of body must be a string"),
    handleValidationErrors,
    (req, res) => {
        const {
            id
        } = req.params;
        const found = sessions.get(id);
        if (!found) return res.status(400).json({
            status: "error",
            error: "session not found"
        });

        const {
            handle,
            lines
        } = found;

        for (const line of req.body) {
            const formatedLine = handle.add(line);
            if (formatedLine)
                lines.add(formatedLine);
        }

        return res.status(200).json({
            status: "ok"
        });
    });

app.get("/sessions/:id/lines",
    param("id").isUUID().withMessage("id must be a valid UUID"),
    handleValidationErrors,
    (req, res) => {
        const {
            id
        } = req.params;
        const found = sessions.get(id);
        if (!found) return res.status(400).json({
            status: "error",
            error: "session not found"
        });

        const {
            lines
        } = found;
        return res.status(200).json({
            status: "ok",
            lines: Array.from(lines)
        });
    });

app.post("/sessions/:id/search",
    param("id").isUUID().withMessage("id must be a valid UUID"),
    handleValidationErrors,
    (req, res) => {
        const {
            id
        } = req.params;
        const found = sessions.get(id);
        if (!found) return res.status(400).json({
            status: "error",
            error: "session not found"
        });

        const {
            handle,
            lines
        } = found;
        const newLines = [];
        handle.execute(c => {
            newLines.push(c);
            lines.add(c);
        });

        return res.status(200).json({
            status: "ok",
            lines: newLines
        });
    });

app.use((req, res, next) => {
    return res.status(404).json({
        status: "error",
        error: "invalid endpoint",
        path: req.path,
        method: req.method
    });
});

app.listen(PORT, HOST, async () => {
    try {
        await access("data.json");
        const data = await readFile("data.json", "utf-8");
        for (const {
                id,
                limit,
                lines
            }
            of JSON.parse(data)) {
            const handle = new search(limit, limit);
            const lineSet = new Set();
            for (const line of lines) {
                handle.add(line);
                lineSet.add(line);
            }
            sessions.set(id, {
                limit,
                handle,
                lines: lineSet
            });
        }
    } catch {}

    setInterval(async () => {
        const data = Array.from(sessions.entries()).map(([id, data]) => ({
            id,
            limit: data.limit,
            lines: Array.from(data.lines)
        }));
        await writeFile("data.json", JSON.stringify(data), "utf-8");
    }, SAVE_INTERVAL * 1000);

    console.log(`Search API running at http://${HOST}:${PORT}`);
}).on("error", (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
});
