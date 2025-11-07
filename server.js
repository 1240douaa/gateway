const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const YAML = require("yamljs");
const cors = require("cors");

const app = express();
app.use(cors());

// Charger le fichier YAML
const config = YAML.load("./routes.yaml");

// Créer les proxys pour chaque route
for (const route in config.routes) {
  const serviceName = config.routes[route].target;
  const targetUrl = config.services[serviceName].url;

  app.use(
    route,
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: (path, req) => path.replace(new RegExp(`^${route}`), route)
    })
  );
}

app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running! Try /api/courses or /api/students or /graphql");
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Gateway running on http://localhost:${PORT}`));
