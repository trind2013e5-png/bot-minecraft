const mineflayer = require('mineflayer');
const config = require('./config');

let bot;

// ============= BOT INITIALIZATION =============

function initializeBot() {
  try {
    if (config.server.type === 'java') {
      initializeJavaBot();
    } else if (config.server.type === 'bedrock') {
      initializeBedrockBot();
    } else {
      console.error('❌ Invalid SERVER_TYPE. Use "java" or "bedrock"');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

// ============= JAVA EDITION BOT =============

function initializeJavaBot() {
  console.log('🎮 Initializing Java Edition bot...');

  const { pathfinder, Movements } = require('mineflayer-pathfinder');

  bot = mineflayer.createBot({
    host: process.env.SERVER_HOST || config.server.host,
    port: process.env.SERVER_PORT || config.server.port,
    username: process.env.BOT_USERNAME || config.bot.username,
    version: process.env.MC_VERSION || config.server.version,
    auth: process.env.AUTH_TYPE || config.server.auth,
  });

  // Load pathfinder plugin
  try {
    bot.loadPlugin(pathfinder);
  } catch (e) {
    console.warn('⚠️ Pathfinder plugin failed to load:', e.message);
  }

  bot.on('login', () => {
    console.log(`✅ Java Bot logged in as ${bot.username}`);
    console.log(`🎮 Connected to: ${config.server.host}:${config.server.port}`);
    console.log(`📦 Edition: Java ${config.server.version}`);

    if (config.bot.autoEat) {
      try {
        bot.autoEat.enable();
        console.log('🍗 Auto-eating enabled');
      } catch (e) {
        console.warn('⚠️ Auto-eat not available:', e.message);
      }
    }
  });

  bot.on('spawn', () => {
    console.log('🌍 Bot spawned in world');

    try {
      const movements = new Movements(bot);
      movements.canDig = config.movement.canDig;
      movements.canPlaceOn = config.movement.canPlaceOn;
      bot.pathfinder.setMovements(movements);
    } catch (e) {
      console.warn('⚠️ Movement setup failed:', e.message);
    }
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`💬 ${username}: ${message}`);

    if (message.startsWith(config.bot.chatPrefix)) {
      handleCommand(username, message.slice(config.bot.chatPrefix.length), 'java');
    }
  });

  bot.on('end', (reason) => {
    console.log(`❌ Disconnected: ${reason}`);
    if (config.bot.autoReconnect) {
      console.log('🔄 Reconnecting in 5 seconds...');
      setTimeout(initializeBot, 5000);
    }
  });

  bot.on('error', (err) => {
    console.error(`⚠️ Error: ${err.message}`);
  });
}

// ============= BEDROCK EDITION BOT =============

function initializeBedrockBot() {
  console.log('🎮 Initializing Bedrock Edition bot...');

  let bedrock;
  try {
    bedrock = require('bedrock-protocol');
  } catch (e) {
    console.error('❌ bedrock-protocol not found. Run: npm install bedrock-protocol');
    process.exit(1);
  }

  const client = bedrock.createClient({
    host: process.env.SERVER_HOST || config.server.host,
    port: parseInt(process.env.SERVER_PORT || config.server.port) || 19132,
    username: process.env.BOT_USERNAME || config.bot.username,
    offline: true,
    version: process.env.MC_VERSION || config.server.version || '1.21.0',
  });

  // Compatible bot object
  bot = {
    username: process.env.BOT_USERNAME || config.bot.username,
    edition: 'bedrock',
    health: 20,
    food: 20,
    entity: { position: { x: 0, y: 64, z: 0 } },
    _client: client,
    _moving: false,
    _runtimeId: null,

    chat: (message) => {
      try {
        client.queue('text', {
          type: 'chat',
          needs_translation: false,
          source_name: bot.username,
          xuid: '',
          platform_chat_id: '',
          message: String(message),
        });
        console.log(`🤖 Bot: ${message}`);
      } catch (err) {
        console.error(`⚠️ Failed to send chat: ${err.message}`);
      }
    },

    moveTo: (targetX, targetY, targetZ) => {
      if (bot._moving) {
        bot._moving = false;
        setTimeout(() => bot.moveTo(targetX, targetY, targetZ), 100);
        return;
      }

      bot._moving = true;
      bot.chat(`Moving to: ${targetX}, ${targetY}, ${targetZ}`);
      console.log(`🚶 Bedrock moving to: ${targetX}, ${targetY}, ${targetZ}`);

      const STEP = config.movement.stepSize ?? 0.4;
      const INTERVAL = config.movement.tickInterval ?? 50;
      const REACH = config.movement.reachDistance ?? 1.0;

      const moveInterval = setInterval(() => {
        if (!bot._moving) {
          clearInterval(moveInterval);
          return;
        }

        const pos = bot.entity.position;
        const dx = targetX - pos.x;
        const dy = targetY - pos.y;
        const dz = targetZ - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= REACH && Math.abs(dy) <= REACH) {
          clearInterval(moveInterval);
          bot._moving = false;
          bot.entity.position = { x: targetX, y: targetY, z: targetZ };
          bot.chat(`Reached: ${targetX}, ${targetY}, ${targetZ}`);
          console.log(`✅ Bedrock reached target`);
          return;
        }

        const len = Math.max(dist, 0.01);
        const newX = pos.x + (dx / len) * Math.min(STEP, dist);
        const newZ = pos.z + (dz / len) * Math.min(STEP, dist);
        const newY = pos.y + Math.sign(dy) * Math.min(0.3, Math.abs(dy));

        const yaw = Math.atan2(-dx, dz);

        try {
          client.queue('move_player', {
            runtime_id: bot._runtimeId ?? 1n,
            position: { x: newX, y: newY + 1.62, z: newZ },
            pitch: 0,
            yaw: yaw,
            head_yaw: yaw,
            mode: 0,
            on_ground: true,
            ridden_runtime_id: 0n,
            cause: { type: 'unknown', entity_id: 0n },
            tick: BigInt(Date.now()),
          });

          bot.entity.position = { x: newX, y: newY, z: newZ };
        } catch (err) {
          console.error(`⚠️ Move packet error: ${err.message}`);
          clearInterval(moveInterval);
          bot._moving = false;
        }
      }, INTERVAL);
    },

    stopMoving: () => {
      bot._moving = false;
      console.log('🛑 Bedrock movement stopped');
    },

    quit: () => {
      try {
        client.disconnect('Bot shutting down');
      } catch (_) {}
      console.log('Closing Bedrock connection...');
    },

    loadPlugin: () => {},
  };

  // Get runtime ID
  client.on('start_game', (packet) => {
    bot._runtimeId = packet.runtime_entity_id ?? 1n;
    console.log(`🆔 Bot runtime ID: ${bot._runtimeId}`);
  });

  // Spawn success
  client.on('spawn', () => {
    console.log(`✅ Bedrock Bot logged in as ${bot.username}`);
    console.log(`🎮 Connected to: ${config.server.host}:${config.server.port}`);
    console.log(`📱 Edition: Bedrock (offline/cracked)`);

    if (config.bot.autoEat) {
      console.log('🍗 Auto-eating enabled');
    }

    if (config.bot.autoChat) {
      setupBedrockAutoChat();
    }
  });

  // Receive chat
  client.on('text', (packet) => {
    const username = packet.source_name;
    const message = packet.message;

    if (!username || username === bot.username) return;
    console.log(`💬 ${username}: ${message}`);

    if (message.startsWith(config.bot.chatPrefix)) {
      handleCommand(username, message.slice(config.bot.chatPrefix.length), 'bedrock');
    }
  });

  // Update position
  client.on('move_player', (packet) => {
    if (packet.runtime_id === 1n || packet.runtime_id === 1) {
      bot.entity.position = {
        x: packet.position.x,
        y: packet.position.y,
        z: packet.position.z,
      };
    }
  });

  // Update health and food
  client.on('update_attributes', (packet) => {
    for (const attr of (packet.attributes || [])) {
      if (attr.name === 'minecraft:health') bot.health = Math.round(attr.current);
      if (attr.name === 'minecraft:food') bot.food = Math.round(attr.current);
    }
  });

  // Disconnect
  client.on('disconnect', (packet) => {
    console.log(`❌ Disconnected: ${packet.message}`);
    if (config.bot.autoReconnect) {
      console.log('🔄 Reconnecting in 5 seconds...');
      setTimeout(initializeBot, 5000);
    }
  });

  client.on('error', (err) => {
    console.error(`⚠️ Bedrock error: ${err.message}`);
  });
}

// Auto chat for Bedrock
function setupBedrockAutoChat() {
  setInterval(() => {
    if (Math.random() < 0.1) {
      const messages = [
        'I am a Bedrock bot!',
        'Hello from Bedrock Edition!',
        'Running on bedrock-protocol (offline mode)',
      ];
      bot.chat(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, 30000);
}

// ============= COMMAND HANDLER =============

function handleCommand(username, input, edition) {
  const [command, ...args] = input.trim().split(' ');

  console.log(`⚙️ Command: ${command} from ${username} (${edition})`);

  switch (command.toLowerCase()) {
    case 'help': {
      const extraCommands = edition === 'java'
        ? ', !goto <x> <y> <z>, !stop'
        : ', !goto <x> <y> <z>, !stop';
      bot.chat(`Available commands: !help, !status, !version, !dance, !hello${extraCommands}`);
      break;
    }

    case 'status': {
      const pos = bot.entity.position;
      bot.chat(`Health: ${bot.health}/20, Food: ${bot.food}/20, Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`);
      break;
    }

    case 'version': {
      const editionName = config.server.type === 'java' ? 'Java' : 'Bedrock';
      const versionInfo = config.server.type === 'java' ? config.server.version : 'Latest';
      bot.chat(`Running ${editionName} Edition (${versionInfo})`);
      break;
    }

    case 'goto': {
      if (args.length < 3) {
        bot.chat('Usage: !goto <x> <y> <z>');
        break;
      }
      const gx = parseFloat(args[0]);
      const gy = parseFloat(args[1]);
      const gz = parseFloat(args[2]);
      if (edition === 'java') {
        moveToCoordinatesJava(gx, gy, gz);
      } else {
        bot.moveTo(gx, gy, gz);
      }
      break;
    }

    case 'stop': {
      if (edition === 'java') {
        if (bot.pathfinder) {
          bot.pathfinder.stop();
          bot.chat('Movement stopped');
        }
      } else {
        bot.stopMoving();
        bot.chat('Movement stopped');
      }
      break;
    }

    case 'dance':
      performDance();
      break;

    case 'hello':
      bot.chat(`Hello ${username}! I'm ${bot.username}`);
      break;

    default:
      bot.chat(`Unknown command: ${command}. Type !help for available commands.`);
  }
}

// ============= MOVEMENT =============

function moveToCoordinatesJava(x, y, z) {
  try {
    const { goals } = require('mineflayer-pathfinder');
    const goal = new goals.GoalBlock(Math.floor(x), Math.floor(y), Math.floor(z));

    bot.pathfinder.setGoal(goal);
    bot.chat(`Moving to: ${x}, ${y}, ${z}`);

    bot.once('goal_reached', () => {
      bot.chat(`Reached target: ${x}, ${y}, ${z}`);
    });
  } catch (e) {
    console.warn('⚠️ Pathfinder not available:', e.message);
    bot.chat('Pathfinding unavailable');
  }
}

// ============= ACTIONS =============

function performDance() {
  let direction = 0;
  const danceInterval = setInterval(() => {
    if (bot.look) {
      bot.look(direction * Math.PI / 2, 0);
    }
    direction = (direction + 1) % 4;
  }, 200);

  setTimeout(() => {
    clearInterval(danceInterval);
    bot.chat('💃 Dance finished!');
  }, 3000);
}

// ============= AUTO CHAT (Java) =============

if (config.server.type === 'java' && config.bot.autoChat) {
  setInterval(() => {
    if (bot && Math.random() < 0.1) {
      const messages = [
        'I am a Java bot!',
        'Hello from Java Edition!',
        'Running on mineflayer',
      ];
      bot.chat(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, 30000);
}

// ============= STARTUP =============

console.log('🚀 Minecraft Bot v2.0.0 starting...');
console.log(`📝 Server Type: ${config.server.type.toUpperCase()}`);
console.log(`📝 Config loaded successfully`);

initializeBot();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (bot && bot.quit) {
    bot.quit();
  }
  process.exit(0);
});
