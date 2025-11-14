import crypto from "node:crypto";
import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import {
    parse,
    unparse,
    search
} from "./index.js";

const app = express();
app.use(express.json());

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Deductive System API",
            version: "1.0.0",
            description: "API for searching and managing rules in deductive systems.",
        },
        servers: [{
            url: `https://3000.http.proxy.hzhang.xyz:44433`,
            description: "The development server",
        }, ],
    },
    apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const sessions = new Map();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check the health status of the service
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: The health status of the service
 *                 timestamp:
 *                   type: string
 *                   example: "2025-11-14T16:21:53.996"
 *                   description: The current server timestamp
 */
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new search session
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - limit
 *             properties:
 *               limit:
 *                 type: integer
 *                 example: 1024
 *                 description: The limit of lines to search
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *                   description: The ID of the created search session
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: "invalid limit"
 *                  description: Error message indicating the reason for failure
 */
app.post("/sessions", (req, res) => {
    if (!req.body) return res.status(400).json({
        error: "missing body"
    });
    const {
        limit
    } = req.body;
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit <= 0) return res.status(400).json({
        error: "invalid limit"
    });

    const id = crypto.randomUUID();
    const handle = new search(limit, limit);
    const lines = new Set();
    sessions.set(id, {
        limit,
        handle,
        lines
    });
    return res.status(201).json({
        id
    });
});

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get list of all search sessions
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *                     description: The ID of the search session
 *                   limit:
 *                     type: integer
 *                     example: 1024
 *                     description: The limit of lines to search
 *                   size:
 *                     type: integer
 *                     example: 0
 *                     description: The number of lines in the session
 */
app.get("/sessions", (req, res) => {
    return res.status(200).json(
        Array.from(sessions.entries()).map(([id, data]) => ({
            id,
            limit: data.limit,
            size: data.lines.size
        }))
    );
});

/**
 * @swagger
 * /sessions/{id}:
 *   delete:
 *     summary: Delete a search session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The ID of the search session
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *                   description: The ID of the deleted search session
 *       404:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "session not found"
 *                   description: Error message indicating the reason for failure
 */
app.delete("/sessions/:id", (req, res) => {
    const {
        id
    } = req.params;
    if (!sessions.has(id)) return res.status(404).json({
        error: "session not found"
    });

    sessions.delete(id);
    return res.status(200).json({
        id
    });
});

/**
 * @swagger
 * /sessions/{id}/lines:
 *   post:
 *     summary: Add lines to a search session
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The ID of the search session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *             example: ["a -> b", "a"]
 *             description: An array of lines to add to the search session
 *     responses:
 *       200:
 *         description: Lines added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *                   description: The ID of the search session
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "missing body"
 *                   description: Error message indicating the reason for failure
 *       404:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "search not found"
 *                   description: Error message indicating the reason for failure
 */
app.post("/sessions/:id/lines", (req, res) => {
    const {
        id
    } = req.params;
    const found = sessions.get(id);
    if (!found) return res.status(404).json({
        error: "search not found"
    });
    const {
        handle,
        lines
    } = found;

    if (!req.body) return res.status(400).json({
        error: "missing body"
    });
    if (!Array.isArray(req.body)) return res.status(400).json({
        error: "lines must be an array"
    });
    const inputLines = req.body;
    if (!inputLines.every(l => typeof l === "string")) return res.status(400).json({
        error: "invalid line(s)"
    });

    for (const line of inputLines)
        if (handle.add(line)) {
            lines.add(unparse(parse(line)));
        }
    return res.status(200).json({
        id
    });
});

/**
 * @swagger
 * /sessions/{id}/lines:
 *   get:
 *     summary: Get lines from a search session
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The ID of the search session
 *     responses:
 *       200:
 *         description: Lines added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["a -> b", "a"]
 *               description: An array of lines in the search session
 *       404:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "search not found"
 *                   description: Error message indicating the reason for failure
 */
app.get("/sessions/:id/lines", (req, res) => {
    const {
        id
    } = req.params;
    const found = sessions.get(id);
    if (!found) return res.status(404).json({
        error: "search not found"
    });
    const {
        lines
    } = found;

    return res.status(200).json(Array.from(lines));
});

/**
 * @swagger
 * /sessions/{id}/search:
 *   post:
 *     summary: Execute search in a session
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The ID of the search session
 *     responses:
 *       200:
 *         description: Search executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["b"]
 *               description: An array of newly found lines from the search
 *       404:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "search not found"
 *                   description: Error message indicating the reason for failure
 */
app.post("/sessions/:id/search", (req, res) => {
    const {
        id
    } = req.params;
    const found = sessions.get(id);
    if (!found) return res.status(404).json({
        error: "search not found"
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
    return res.status(200).json(newLines);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Search API running at http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
});
