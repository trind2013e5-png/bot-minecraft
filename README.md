# Minecraft Bot 🤖

A simple and extensible Minecraft bot built with Node.js using [mineflayer](https://github.com/PrismarineJS/mineflayer).

## Features

- 🎮 Connect to Minecraft servers
- 💬 Chat and command handling
- 🚶 Automatic pathfinding and movement
- ❤️ Auto-eating and health management
- 🔌 Plugin architecture for easy extensibility
- ⚙️ Configurable settings

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

Edit `.env` with your server details:
```
SERVER_HOST=localhost
SERVER_PORT=25565
BOT_USERNAME=MinecraftBot
MC_VERSION=1.20.1
```

4. **Start the bot:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Commands

Use the bot with chat commands. Prefix commands with `!` (configurable):

| Command | Description |
|---------|-------------|
| `!help` | Show available commands |
| `!status` | Display bot health, food, and position |
| `!goto <x> <y> <z>` | Move bot to specified coordinates |
| `!stop` | Stop current movement |
| `!dance` | Make bot dance |
| `!hello` | Greet the bot |

Example:
```
/msg MinecraftBot !goto 100 64 200
```

## Configuration

Edit `config.js` to customize:
- Server host and port
- Bot username and version
- Chat prefix
- Movement speeds
- Auto-features (eating, mining)
- Logging levels

## Project Structure

```
bot-minecraft/
├── bot.js           # Main bot file
├── config.js        # Configuration settings
├── package.json     # Dependencies
├── .env.example     # Environment template
└── README.md        # This file
```

## Supported Minecraft Versions

- 1.16.x
- 1.17.x
- 1.18.x
- 1.19.x
- 1.20.x

Change `MC_VERSION` in `.env` to match your server.

## Dependencies

- **mineflayer** - Minecraft bot framework
- **mineflayer-pathfinder** - Pathfinding and movement
- **mineflayer-movements** - Movement behavior
- **dotenv** - Environment configuration

## Troubleshooting

### Bot won't connect
- Check server host and port
- Ensure the server is running and accessible
- Verify Minecraft version matches

### Movement not working
- Install pathfinder: `npm install mineflayer-pathfinder`
- Check if server allows bot movement
- Verify coordinates are within loaded chunks

### Commands not responding
- Check chat prefix in config (default: `!`)
- Verify bot can read chat messages

## Extending the Bot

To add new commands, edit `handleCommand()` in `bot.js`:

```javascript
case 'mycommand':
  myFunction();
  break;
```

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- 📝 Create an issue on GitHub
- 💬 Check existing discussions

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

Made with ❤️ using [mineflayer](https://github.com/PrismarineJS/mineflayer)
