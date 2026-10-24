const { createServer } = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV === 'development';

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

console.log(`Starting AgentEdu Next.js Server on http://${hostname}:${port}...`);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(`> AgentEdu Frontend ready on http://localhost:${port}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}).catch((err) => {
  console.error('Error starting Next.js server:', err);
  process.exit(1);
});
