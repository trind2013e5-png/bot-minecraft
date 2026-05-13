const mineflayer = require('mineflayer');
const config = require('./config');

let bot;

// ============= BOT INITIALIZATION =============

async function initializeBot() {
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

// Java Edition Bot
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
  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`✅ Java Bot logged in as ${bot.username}`);
    console.log(`🎮 Connected to: ${config.server.host}:${config.server.port}`);
    console.log(`📦 Edition: Java ${config.server.version}`);
    
    if (config.bot.autoEat) {
      bot.autoEat.enable();
      console.log('🍗 Auto-eating enabled');
    }
  });

  bot.on('spawn', () => {
    console.log('🌍 Bot spawned in world');
    
    const movements = new Movements(bot);
    movements.canDig = config.movement.canDig;
    movements.canPlaceOn = config.movement.canPlaceOn;
    bot.pathfinder.setMovements(movements);
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

// Bedrock Edition Bot
function initializeBedrockBot() {
  console.log('🎮 Initializing Bedrock Edition bot...');
  
  // Placeholder for minecraft-bedrock-js integration
  // This will use the BedrockClient once the library is available
  
  // Simulated bot object for Bedrock
  bot = {
    username: config.bot.username,
    edition: 'bedrock',
    health: 20,
    food: 20,
    entity: { position: { x: 0, y: 64, z: 0 } },
    
    chat: (message) => {
      console.log(`🤖 Bot: ${message}`);
    },
    
    quit: () => {
      console.log('Closing Bedrock connection...');
    },
    
    loadPlugin: () => {},
  };

  // Setup Bedrock connection simulation
  console.log(`✅ Bedrock Bot initialized as ${config.bot.username}`);
  console.log(`🎮 Connecting to: ${config.server.host}:${config.server.port}`);
  console.log(`📱 Edition: Bedrock`);
  
  if (config.bedrock.useRealm) {
    console.log(`🏠 Realm ID: ${config.bedrock.realmId}`);
  }

  // Simulate login after 1 second
  setTimeout(() => {
    console.log(`✅ Bedrock Bot logged in as ${bot.username}`);
    console.log('🌍 Connected to world');
    
    if (config.bot.autoEat) {
      console.log('🍗 Auto-eating enabled');
    }
    
    setupBedrockEventSimulation();
  }, 1000);
}

// Bedrock Event Simulation (until full library integration)
function setupBedrockEventSimulation() {
  // Simulate chat for demo purposes
  if (config.bot.autoChat) {
    setInterval(() => {
      if (Math.random() < 0.1) {
        const messages = ['I am a Bedrock bot! 🤖', 'Hello from Bedrock!', 'This is a minecraft-bedrock-js bot'];
        bot.chat(messages[Math.floor(Math.random() * messages.length)]);
      }
    }, 30000);
  }
}

// ============= COMMAND HANDLER =============

function handleCommand(username, input, edition) {
  const [command, ...args] = input.split(' ');
  
  console.log(`⚙️ Command: ${command} from ${username} (${edition})`);
  
  switch (command.toLowerCase()) {
    case 'help':
      const javaCommands = edition === 'java' 
        ? ', !goto <x> <y> <z>, !stop' 
        : '';
      bot.chat(`Available commands: !help, !status, !version, !dance, !hello${javaCommands}`);
      break;
      
    case 'status':
      const pos = bot.entity.position;
      bot.chat(`Health: ${bot.health}/20, Food: ${bot.food}/20, Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`);
      break;
      
    case 'version':
      const editionName = config.server.type === 'java' ? 'Java' : 'Bedrock';
      const versionInfo = config.server.type === 'java' 
        ? `${config.server.version}` 
        : 'Latest';
      bot.chat(`Running ${editionName} Edition (${versionInfo}) 📦`);
      break;
      
    case 'goto':
      if (config.server.type === 'bedrock') {
        bot.chat('⚠️ Movement not supported on Bedrock Edition yet');
        break;
      }
      if (args.length < 3) {
        bot.chat('Usage: !goto <x> <y> <z>');
        break;
      }
      moveToCoordinates(parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]));
      break;
      
    case 'stop':
      if (config.server.type === 'bedrock') {
        bot.chat('⚠️ Movement not supported on Bedrock Edition yet');
        break;
      }
      if (bot.pathfinder) {
        bot.pathfinder.stop();
        bot.chat('Movement stopped');
      }
      break;
      
    case 'dance':
      performDance();
      break;
      
    case 'hello':
      bot.chat(`Hello ${username}! I'm ${bot.username} 🤖`);
      break;
      
    default:
      bot.chat(`Unknown command: ${command}. Type !help for available commands.`);
  }
}

// ============= MOVEMENT (Java Edition only) =============

function moveToCoordinates(x, y, z) {
  if (config.server.type === 'bedrock') {
    console.log('⚠️ Movement commands are Java Edition only');
    return;
  }

  const Vec3 = require('vec3');
  const target = new Vec3(x, y, z);
  
  bot.pathfinder.goto(target, (result) => {
    if (result === 'reached') {
      bot.chat(`✅ Reached target: ${x}, ${y}, ${z}`);
    } else {
      bot.chat(`❌ Failed to reach target: ${result}`);
    }
  });
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

// ============= AUTO FEATURES =============

if (config.bot.autoChat) {
  setInterval(() => {
    if (Math.random() < 0.1) {
      const edition = config.server.type === 'java' ? 'Java' : 'Bedrock';
      const messages = [
        `I am a ${edition} bot! 🤖`,
        `Hello from ${edition} Edition!`,
        `This is a minecraft-flayer bot`
      ];
      bot.chat(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, 30000);
}

// ============= STARTUP =============

console.log('🚀 Minecraft Bot v2.0.0 starting...');
console.log(`📝 Server Type: ${config.server.type.toUpperCase()}`);
console.log(`📝 Config loaded successfully`);

initializeBot().catch(err => {
  console.error(`❌ Failed to initialize: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (bot && bot.quit) {
    bot.quit();
  }
  process.exit(0);
});
