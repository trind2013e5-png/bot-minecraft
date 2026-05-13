const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const config = require('./config');

// Create bot instance
const bot = mineflayer.createBot({
  host: process.env.SERVER_HOST || config.server.host,
  port: process.env.SERVER_PORT || config.server.port,
  username: process.env.BOT_USERNAME || config.bot.username,
  version: process.env.MC_VERSION || config.server.version,
  auth: process.env.AUTH_TYPE || config.server.auth,
});

// Load pathfinder plugin
bot.loadPlugin(pathfinder);

// ============= EVENTS =============

bot.on('login', () => {
  console.log(`✅ Bot logged in as ${bot.username}`);
  console.log(`🎮 Connected to server: ${config.server.host}:${config.server.port}`);
  
  if (config.bot.autoEat) {
    bot.autoEat.enable();
    console.log('🍗 Auto-eating enabled');
  }
});

bot.on('spawn', () => {
  console.log('🌍 Bot spawned in world');
  
  // Set up movements
  const movements = new Movements(bot);
  movements.canDig = true;
  movements.canPlaceOn = true;
  bot.pathfinder.setMovements(movements);
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  
  console.log(`💬 ${username}: ${message}`);
  
  // Check for commands
  if (message.startsWith(config.bot.chatPrefix)) {
    handleCommand(username, message.slice(config.bot.chatPrefix.length));
  }
});

bot.on('end', (reason) => {
  console.log(`❌ Disconnected: ${reason}`);
  if (config.bot.autoReconnect) {
    console.log('🔄 Reconnecting in 5 seconds...');
    setTimeout(() => {
      bot.quit();
    }, 5000);
  }
});

bot.on('error', (err) => {
  console.error(`⚠️ Error: ${err.message}`);
});

// ============= COMMAND HANDLER =============

function handleCommand(username, input) {
  const [command, ...args] = input.split(' ');
  
  console.log(`⚙️ Command: ${command} from ${username}`);
  
  switch (command.toLowerCase()) {
    case 'help':
      bot.chat(`Available commands: !help, !status, !goto <x> <y> <z>, !stop, !dance, !hello`);
      break;
      
    case 'status':
      const pos = bot.entity.position;
      bot.chat(`Health: ${bot.health}/20, Food: ${bot.food}/20, Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`);
      break;
      
    case 'goto':
      if (args.length < 3) {
        bot.chat('Usage: !goto <x> <y> <z>');
        break;
      }
      moveToCoordinates(parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]));
      break;
      
    case 'stop':
      bot.pathfinder.stop();
      bot.chat('Movement stopped');
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

// ============= MOVEMENT =============

function moveToCoordinates(x, y, z) {
  const target = new (require('vec3'))(x, y, z);
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
    bot.look(direction * Math.PI / 2, 0);
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
      const messages = ['I am a bot! 🤖', 'Hello everyone!', 'This is a mineflayer bot'];
      bot.chat(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, 30000);
}

console.log('🚀 Minecraft Bot starting...');
console.log(`📝 Config: ${JSON.stringify(config, null, 2)}`);
