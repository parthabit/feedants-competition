const mongoose = require('mongoose');
const config = require('./config');
const { createApp } = require('./app');
const { startSweeper } = require('./services/holdSweeper');

async function main() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { maxPoolSize: 50, serverSelectionTimeoutMS: 8000 });
  console.log('[db] connected');

  // Make sure the unique / partial indexes that enforce our invariants exist before serving traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

  const app = createApp();
  const server = app.listen(config.port, () => console.log(`[api] listening on :${config.port} (${config.env}, payments=${config.paymentProvider})`));
  const stopSweeper = startSweeper();

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    stopSweeper();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
