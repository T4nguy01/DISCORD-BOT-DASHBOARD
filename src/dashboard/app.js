const express = require("express");
const path = require("node:path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const createControllers = require("./controllers");
const createRoutes = require("./routes");
const errorHandler = require("./errorHandler");
const telemetry = require("../core/telemetry");

function startDashboard(client) {
    const app = express();
    const port = Number(process.env.DASHBOARD_PORT || 3000);

    // 1. Security & performance middleware
    app.use(helmet({
        contentSecurityPolicy: false, // Allow inline styles/scripts for our simple dashboard
    }));
    app.use(compression());
    app.use(express.json());

    // 2. Static files
    app.use(express.static(path.join(__dirname, "../../dashboard")));

    // 3. API Rate limiting
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Trop de requêtes, veuillez réessayer plus tard." }
    });
    app.use("/api/", apiLimiter);

    // 4. Routes
    const controllers = createControllers(client);
    const routes = createRoutes(controllers);
    app.use("/api", routes);

    // 5. Global Error Handler
    app.use(errorHandler);

    // 6. Start server
    app.listen(port, () => {
        telemetry.recordSystem("dashboard_started", `http://localhost:${port}`);
        console.log(`✅ Dashboard web disponible sur http://localhost:${port}`);
    });
}

module.exports = { startDashboard };
