require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    type: process.env.SERVER_TYPE || 'java', // 'java' or 'bedrock'
    host: process.env.SERVER_HOST || 'localhost',
    port: process.env.SERVER_PORT || 25565,
    version: process.env.MC_VERSION || '1.20.1', // For Java Edition
    auth: process.env.AUTH_TYPE || 'offline', // 'offline' or 'microsoft'
  },

  // Bedrock-specific Configuration
  bedrock: {
    xboxUsername: process.env.XBOX_USERNAME || '',
    botPassword: process.env.BOT_PASSWORD || '',
    useRealm: process.env.USE_REALM === 'true' || false,
    realmId: process.env.REALM_ID || '',
  },

  // Bot Configuration
  bot: {
    username: process.env.BOT_USERNAME || 'MinecraftBot',
    chatPrefix: '!',
    autoReconnect: true,
    autoEat: true,
    autoChat: false,
  },

  // Movement Configuration (Java Edition only)
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
