require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    type: process.env.SERVER_TYPE || 'java', // 'java' or 'bedrock'
    host: process.env.SERVER_HOST || 'localhost',
    port: process.env.SERVER_PORT || 25565,
    version: process.env.MC_VERSION || '1.20.1',
    auth: process.env.AUTH_TYPE || 'offline', // 'offline' or 'microsoft'
  },

  // Bedrock-specific Configuration
  bedrock: {
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

  // Movement Configuration
  movement: {
    // Java Edition (mineflayer-pathfinder)
    canDig: true,
    canPlaceOn: true,

    // Bedrock Edition (packet-based movement)
    stepSize: 0.4,       // block mỗi tick (tốc độ di chuyển)
    tickInterval: 50,    // ms mỗi tick (50 = 20 ticks/giây)
    reachDistance: 1.0,  // coi là đến nơi khi còn cách bao nhiêu block
  },

  // Logging Configuration
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
  },
};
