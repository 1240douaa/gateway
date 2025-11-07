const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Routes du gateway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Gateway is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>API Gateway</title></head>
      <body style="font-family: Arial; padding: 50px;">
        <h1>🚀 API Gateway is running!</h1>
        <h2>Available endpoints:</h2>
        <ul>
          <li><a href="/api/students/">/api/students/</a></li>
          <li><a href="/api/courses/">/api/courses/</a></li>
          <li><a href="/graphql">/graphql</a></li>
        </ul>
      </body>
    </html>
  `);
});

// ===== CONFIGURATION SPÉCIALE POUR COURSES =====
// Django attend le chemin complet /api/courses/

const coursesProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  // Option 1: Router qui préserve le chemin
  router: function(req) {
    console.log(`[COURSES ROUTER] Request: ${req.originalUrl}`);
    return 'http://localhost:8000';
  },
  pathRewrite: function(path, req) {
    // Construire le chemin complet
    const fullPath = req.originalUrl;
    console.log(`[COURSES PATHREWRITE] ${path} -> ${fullPath}`);
    return fullPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[COURSES] Proxying to: http://localhost:8000${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[COURSES] Response: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[COURSES ERROR]:', err.message);
    res.status(502).json({ error: 'Cannot reach courses service' });
  }
});

// Appliquer le proxy courses
app.use('/api/courses', coursesProxy);

// Proxy Students - Configuration standard
app.use('/api/students', createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[STUDENTS] ${req.method} ${req.originalUrl} -> http://localhost:8081${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[STUDENTS] Response: ${proxyRes.statusCode}`);
  }
}));

// Proxy GraphQL
app.use('/graphql', createProxyMiddleware({
  target: 'http://localhost:8002',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[GRAPHQL] ${req.method} ${req.originalUrl} -> http://localhost:8002${req.originalUrl}`);
  }
}));

const PORT = 4000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 API Gateway started');
  console.log('='.repeat(60));
  console.log(`\nGateway: http://localhost:${PORT}`);
  console.log(`\nTest URLs:`);
  console.log(`  curl http://localhost:${PORT}/api/students/`);
  console.log(`  curl http://localhost:${PORT}/api/courses/`);
  console.log('\n' + '='.repeat(60) + '\n');
});