# Minecraft Bot 🤖

A versatile Minecraft bot built with Node.js supporting both **Java Edition** and **Bedrock Edition** using mineflayer and minecraft-bedrock-js.

## ✨ Features

### Common Features
- 🎮 Connect to Minecraft servers (Java & Bedrock)
- 💬 Chat and command handling
- 🚶 Automatic pathfinding and movement (Java Edition)
- ❤️ Auto-eating and health management
- 🔌 Plugin architecture for easy extensibility
- ⚙️ Configurable settings
- 🔄 Auto-reconnection support

### Java Edition Specific
- ✅ A* pathfinding algorithm
- ✅ Block digging and placement
- ✅ Full movement capabilities

### Bedrock Edition Specific
- ✅ Xbox Live authentication
- ✅ Minecraft Realms support
- ✅ Cross-platform compatibility

## 📋 Supported Versions

### Java Edition
- 1.16.x through 1.20.x
- Customizable version selection

### Bedrock Edition
- All versions supported
- Bedrock servers
- Minecraft Realms

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/trind2013e5-png/bot-minecraft.git
cd bot-minecraft
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

## Configuration

### For Java Edition

Edit `.env`:
```
SERVER_TYPE=java
SERVER_HOST=localhost
SERVER_PORT=25565
MC_VERSION=1.20.1
AUTH_TYPE=offline
BOT_USERNAME=MinecraftBot
```

Start with:
```bash
npm run start:java
# or
npm start
```

### For Bedrock Edition

Edit `.env`:
```
SERVER_TYPE=bedrock
SERVER_HOST=bedrock.server.com
SERVER_PORT=19132
XBOX_USERNAME=your_xbox_email@example.com
BOT_PASSWORD=your_xbox_password
```

Optional - For Minecraft Realms:
```
USE_REALM=true
REALM_ID=your_realm_id
```

Start with:
```bash
npm run start:bedrock
```

## Commands

Both Java and Bedrock editions support the following chat commands (prefix: `!`):

| Command | Description |
|---------|-------------|
| `!help` | Show available commands |
| `!status` | Display bot health, food, and position |
| `!version` | Show which edition is running |
| `!goto <x> <y> <z>` | Move bot to specified coordinates |
| `!stop` | Stop current movement |
| `!dance` | Make bot perform dance animation |
| `!hello` | Greet the bot |

Example:
```
/msg MinecraftBot !goto 100 64 200
```

## Project Structure

```
bot-minecraft/
├── bot.js              # Main bot file (supports both editions)
├── config.js           # Configuration settings
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .gitignore          # Git ignore patterns
└── README.md           # This file
```

## Dependencies

### Core
- **mineflayer** - Java Edition bot framework
- **mineflayer-pathfinder** - Pathfinding and movement (Java)
- **mineflayer-movements** - Movement behavior (Java)
- **minecraft-bedrock-js** - Bedrock Edition bot support
- **dotenv** - Environment configuration
- **cross-env** - Cross-platform environment variables

## Development

For development with auto-reload:
```bash
npm run dev
```

For specific edition development:
```bash
npm run start:java
npm run start:bedrock
```

## Troubleshooting

### Java Edition

**Bot won't connect**
- Check server host and port
- Ensure the server is running
- Verify Minecraft version matches

**Movement not working**
- Install pathfinder: `npm install mineflayer-pathfinder`
- Check if server allows bot movement
- Verify coordinates are within loaded chunks

### Bedrock Edition

**Authentication failed**
- Verify Xbox Live credentials
- Check internet connection
- Ensure account has Minecraft
- Use app password if 2FA is enabled

**Can't connect to Realms**
- Verify realm ID is correct
- Check USE_REALM is set to true
- Ensure realm is active

**Commands not responding**
- Check chat prefix in config (default: `!`)
- Verify bot can read chat messages
- For Bedrock, some commands may have limited support

## Extending the Bot

### Adding Java Edition Commands
Edit the `handleCommand()` function in `bot.js`:

```javascript
case 'mycommand':
  if (config.server.type === 'java') {
    // Java-specific command
    myJavaFunction();
  }
  break;
```

### Edition-Specific Handlers
```javascript
if (config.server.type === 'bedrock') {
  // Bedrock Edition code
} else {
  // Java Edition code
}
```

## Performance Tips

- Use offline mode for private servers
- Enable auto-eat for survival mode
- Adjust chat frequency for stability
- Monitor memory usage for long-running bots

## License

MIT License - See LICENSE file for details

## Support & Contributing

For issues and questions:
- 📝 Create an issue on GitHub
- 💬 Check existing discussions
- 🐛 Report bugs with edition details

Contributions welcome:
- Report bugs
- Suggest features
- Submit pull requests
- Test Bedrock Edition support

## Changelog

### v1.0.1
- ✨ Added Bedrock Edition support
- ✨ Added Xbox Live authentication
- ✨ Added Minecraft Realms support
- ✨ New `!version` command
- 📝 Updated configuration system

### v1.0.0
- 🎮 Initial Java Edition release

---

Made with ❤️ using [mineflayer](https://github.com/PrismarineJS/mineflayer) and minecraft-bedrock-js
