const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const logger = require('./src/logger');
const config = require('./src/config');
const DingTalkStreamClient = require('./src/client');

async function main() {
  logger.info('Starting DingTalk Stream Service...');

  try {
    // Load configuration
    await config.load();
    logger.info('Configuration loaded successfully');

    // Create and start stream client
    const client = new DingTalkStreamClient();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await client.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await client.stop();
      process.exit(0);
    });

    // Start the client
    await client.start();
    logger.info('DingTalk Stream Service started successfully');

  } catch (error) {
    logger.error('Failed to start DingTalk Stream Service:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();