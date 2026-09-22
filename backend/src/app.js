const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');

const config = require('./config');
const webhooks = require('./routes/webhooks');
const competitions = require('./routes/competitions');
const testimonials = require('./routes/testimonials');
const dev = require('./routes/dev');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind a load balancer

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(compression());

  // Must come BEFORE express.json(): the webhook needs the raw body for signature verification.
  app.use('/api/v1/webhooks', webhooks);

  app.use(express.json({ limit: '50kb' }));

  app.get('/health', (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
  });

  app.use('/api/v1/competitions', competitions);
  app.use('/api/v1/testimonials', testimonials);
  if (config.enableDevRoutes) app.use('/api/v1/dev', dev);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
