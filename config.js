require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    host: process.env.SERVER_HOST || 'localhost',
    port: process.env.SERVER_PORT || 25565,
    version: process.env.MC_VERSION || '1.20.1',
    auth: process.env.AUTH_TYPE || 'offline', // 'offline' or 'microsoft'
  },

  // Bot Configuration
  bot: {
    username: process.env.BOT_USERNAME || 'MinecraftBot',
    chatPrefix: '!',
    autoReconnect: true,
    autoEat: true,
    autoChat: false,
  },

  // Movement Configuration
  movement: {
    speed: 0.1,
    canDig: true,
    canPlaceOn: true,
    maxMoveAwayDistance: 128,
  },

  // Logging Configuration
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
  },
};
