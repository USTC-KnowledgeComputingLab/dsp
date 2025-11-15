import {
    fileURLToPath
} from "node:url";
import crypto from "node:crypto";
import express from "express";
import {
    body,
    param,
    validationResult
} from "express-validator";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import {
    parse,
    unparse,
    search
} from "./index.js";

const PORT = process.env.PORT || 3000;

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

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Deductive System API",
            version: "1.0.0",
            description: "API for searching and managing rules in deductive systems.",
        },
        servers: [{
            url: `http://localhost:${PORT}`,
            description: "The development server",
        }, ],
    },
    apis: [fileURLToPath(import.meta.url)],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({
        status: "error",
        error: errors.array()[0].msg
    });
    return next();
};

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
app.get("/health",
    (req, res) => {
        return res.status(200).json({
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
 *                 minimum: 1
 *                 example: 1024
 *                 description: The maximum number of lines to search (must be positive integer)
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Operation status
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
 *                status:
 *                  type: string
 *                  example: "error"
 *                  description: Operation status
 *                error:
 *                  type: string
 *                  example: "limit must be a positive integer"
 *                  description: Error message indicating the reason for failure
 */
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

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get list of all search sessions
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: List of sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Operation status
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *                         description: The ID of the search session
 *                       limit:
 *                         type: integer
 *                         example: 1024
 *                         description: The maximum length of lines to search
 *                       size:
 *                         type: integer
 *                         example: 0
 *                         description: The current number of lines in the session
 */
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
 *           format: uuid
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The UUID of the search session to delete
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Operation status
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                   description: Operation status
 *                 error:
 *                   type: string
 *                   example: "session not found"
 *                   description: Error message indicating the reason for failure
 */
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
 *           format: uuid
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The UUID of the search session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *             example: ["a -> b", "a"]
 *             description: An array of lines to add
 *     responses:
 *       200:
 *         description: Lines added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Operation status
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                   description: Operation status
 *                 error:
 *                   type: string
 *                   example: "session not found"
 *                   description: Error message indicating the reason for failure
 */
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

        for (const line of req.body)
            if (handle.add(line))
                lines.add(unparse(parse(line)));

        return res.status(200).json({
            status: "ok"
        });
    });

/**
 * @swagger
 * /sessions/{id}/lines:
 *   get:
 *     summary: Get all lines from a search session
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The UUID of the search session
 *     responses:
 *       200:
 *         description: Lines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Operation status
 *                 lines:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["a -> b", "a"]
 *                   description: An array of lines in the search session
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                   description: Operation status
 *                 error:
 *                   type: string
 *                   example: "session not found"
 *                   description: Error message indicating the reason for failure
 */
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

/**
 * @swagger
 * /sessions/{id}/search:
 *   post:
 *     summary: Execute search in a session to find new lines
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "842e8504-1300-4b87-89d3-ad9548ce8de1"
 *         description: The UUID of the search session
 *     responses:
 *       200:
 *         description: Search executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Operation status
 *                 lines:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["b"]
 *                   description: An array of newly found lines from the search
 *       400:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                   description: Operation status
 *                 error:
 *                   type: string
 *                   example: "session not found"
 *                   description: Error message indicating the reason for failure
 */
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

app.listen(PORT, () => {
    console.log(`Search API running at http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
});
