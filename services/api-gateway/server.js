// services/api-gateway/server.js

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware'); 
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express(); // 

// --- Security Middleware ---
//
//app.use(helmet());

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors());

// --- Rate Lmiiting ---
//
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);

// -- Health Check -- 
//
app.get('/health', (req, res) => {
	res.json({ status: 'healthy', service: 'api-gateway' });
});

// -- Proxy Routes --
const roomServiceProxy = createProxyMiddleware({
	target: process.env.ROOM_SERVICE_URL,
	changeOrigin: true,
	pathRewrite: {
		'^/api/rooms': '', //Rewrite the path: remove '/api/rooms'
	},
})

const fileServiceProxy = createProxyMiddleware({
	target: process.env.FILE_SERVICE_URL,
	changeOrigin: true,
	pathRewrite: {
		'^/api/files': '',
	},
});

const syncServiceProxy = createProxyMiddleware({
	target: process.env.SYNC_SERVICE_URL,
	changeOrigin: true, 
	ws: true // enable websocket connections
});

app.use('/api/rooms', roomServiceProxy);
app.use('/api/files', fileServiceProxy); 
app.use('/socket.io', syncServiceProxy);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`API Gateway running on port ${PORT}`);
});
