/**
 * Minecraft Bot - Java & Bedrock
 * Auth Microsoft KHÔNG cần mua Minecraft (Nintendo Switch title bypass)
 * Web Dashboard via Express + WebSocket
 */

const mineflayer          = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const chalk               = require('chalk')
const readline            = require('readline')
const express             = require('express')
const http                = require('http')
const { WebSocketServer } = require('ws')
const path                = require('path')
const fs                  = require('fs')
const config              = require('./config.json')

// ─── Web server ───────────────────────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)
const wss    = new WebSocketServer({ server })

app.use(express.static(path.join(__dirname)))
app.use(express.json())

let botInstance = null
const logHistory = []

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() })
  logHistory.push(msg)
  if (logHistory.length > 300) logHistory.shift()
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg) })
}

wss.on('connection', (ws) => {
  logHistory.forEach(m => ws.send(m))
  ws.on('message', (raw) => {
    try { const { action, payload } = JSON.parse(raw); handleDashboardAction(action, payload) } catch {}
  })
})

app.get('/api/config', (_, res) => res.json(config))
app.post('/api/config', (req, res) => {
  Object.assign(config, req.body)
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))
  res.json({ ok: true })
})

// ─── Logger ───────────────────────────────────────────────────────────────────
const log = {
  info:    (msg) => { console.log(chalk.cyan('  [INFO] ') + msg);    broadcast('log', { level: 'info',    msg }) },
  success: (msg) => { console.log(chalk.green('  [✔] ') + msg);      broadcast('log', { level: 'success', msg }) },
  warn:    (msg) => { console.log(chalk.yellow('  [⚠] ') + msg);     broadcast('log', { level: 'warn',    msg }) },
  error:   (msg) => { console.log(chalk.red('  [✘] ') + msg);        broadcast('log', { level: 'error',   msg }) },
  chat:    (user, msg) => { console.log(chalk.magenta(`  [CHAT] ${user}: `) + msg); broadcast('chat', { user, msg }) },
  bot:     (msg) => { console.log(chalk.blue('  [BOT] ') + msg);     broadcast('log', { level: 'bot',     msg }) },
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.clear()
  console.log(chalk.green(`
  ╔══════════════════════════════════════════════════╗
  ║       MINECRAFT BOT — Java & Bedrock             ║
  ║   Dashboard → http://localhost:${String(config.webPort || 3000).padEnd(18)}║
  ╚══════════════════════════════════════════════════╝
  `))
}

// ─── Microsoft Auth (KHÔNG CẦN MUA MINECRAFT) ────────────────────────────────
// Cơ chế: Dùng prismarine-auth với Titles.MinecraftNintendoSwitch
// Nintendo Switch không yêu cầu Java license → lấy được Xbox token hợp lệ
// Token này được mineflayer dùng để login với username Microsoft thật
// ⚠ Server phải TẮT online-mode (cracked/offline) để bot join được
// Nếu server BẬT online-mode → cần tài khoản có Minecraft Java thật
async function getMSAFreeToken(username) {
  const { Authflow, Titles } = require('prismarine-auth')

  log.info('Đang mở Microsoft login... (xem console để lấy link)')
  log.warn('Truy cập link và nhập code để đăng nhập Microsoft')

  const auth = new Authflow(username || 'default', './auth-cache', {
    authTitle: Titles.MinecraftNintendoSwitch,  // bypass Java license check
    deviceType: 'Nintendo',
    flow: 'sisu',
  })

  try {
    // Lấy Minecraft token qua Nintendo title (không cần mua game)
    const xblToken = await auth.getXboxToken()
    log.success(`Xbox auth OK: ${xblToken.userXUID}`)

    // Lấy profile Microsoft để lấy tên
    const profile = await auth.getMinecraftJavaToken({ fetchProfile: true })
    const name = profile?.profile?.name || username || 'MSABot'
    log.success(`Tên Microsoft: ${name}`)
    return { success: true, name, token: profile.token }
  } catch (e) {
    log.error(`MSA-Free lỗi: ${e.message}`)
    return { success: false }
  }
}

// ─── Tạo Bot ──────────────────────────────────────────────────────────────────
async function createBot() {
  broadcast('status', { state: 'connecting' })

  const botOptions = {
    host:    config.host,
    port:    Number(config.port) || 25565,
    version: config.version || false,
  }

  // ── Chọn auth mode ──────────────────────────────────────────────────────────
  if (config.auth === 'microsoft') {
    // Microsoft auth THẬT — cần mua Minecraft Java
    log.info('Auth Microsoft (cần có Minecraft Java)...')
    botOptions.username       = config.username
    botOptions.auth           = 'microsoft'
    botOptions.profilesFolder = './auth-cache'

  } else if (config.auth === 'msa-free') {
    // ✅ Microsoft auth KHÔNG cần mua Minecraft (Nintendo bypass)
    // Server phải chạy offline-mode (cracked) để join
    log.info('Auth MSA-Free (không cần mua Minecraft, server phải offline mode)...')
    const result = await getMSAFreeToken(config.username)
    botOptions.username = result.success ? result.name : (config.username || 'Bot')
    botOptions.auth     = 'offline'  // join server offline
    broadcast('log', { level: 'warn', msg: '⚠ MSA-Free: server phải offline/cracked mode!' })

  } else {
    // Offline — không cần tài khoản gì
    log.info('Auth Offline (không cần tài khoản)...')
    botOptions.username = config.username || 'Bot'
    botOptions.auth     = 'offline'
  }

  // Bedrock
  if (config.edition === 'bedrock') {
    botOptions.port    = Number(config.port) || 19132
    botOptions.bedrock = true
    if (config.auth === 'microsoft') botOptions.auth = 'xbox'
  }

  log.info(`Đang kết nối: ${botOptions.username} → ${config.host}:${botOptions.port} [${(config.edition || 'java').toUpperCase()}]`)

  const bot = mineflayer.createBot(botOptions)
  botInstance = bot
  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    log.success(`Bot "${bot.username}" đã vào server thành công!`)
    broadcast('status', { state: 'online', username: bot.username })
    broadcast('stats', getStats(bot))

    const mv = new Movements(bot)
    mv.canDig = config.canDig !== false
    bot.pathfinder.setMovements(mv)

    if (config.autoRespawn) setupAutoRespawn(bot)
    if (config.antiAfk)    setupAntiAfk(bot)

    setInterval(() => { if (bot?.entity) broadcast('stats', getStats(bot)) }, 3000)
  })

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    log.chat(username, message)
    handleCommands(bot, username, message)
  })

  bot.on('whisper', (username, message) => {
    log.chat(`[Whisper] ${username}`, message)
    handleCommands(bot, username, message)
  })

  bot.on('death',  () => { log.warn('Bot đã chết!'); broadcast('status', { state: 'dead' }) })

  bot.on('kicked', (reason) => {
    log.error(`Bị kick: ${reason}`)
    broadcast('status', { state: 'kicked', reason })
  })

  bot.on('error', (err) => {
    log.error(`Lỗi: ${err.message}`)
    broadcast('status', { state: 'error', reason: err.message })
    if (config.autoReconnect) {
      setTimeout(createBot, (config.reconnectDelay || 5) * 1000)
      log.warn(`Kết nối lại sau ${config.reconnectDelay || 5}s...`)
    }
  })

  bot.on('end', (reason) => {
    log.warn(`Ngắt kết nối: ${reason}`)
    broadcast('status', { state: 'offline', reason })
    botInstance = null
    if (config.autoReconnect) {
      setTimeout(createBot, (config.reconnectDelay || 5) * 1000)
      log.warn(`Kết nối lại sau ${config.reconnectDelay || 5}s...`)
    }
  })

  bot.on('playerJoined', (p) => { if (p.username !== bot.username) { log.info(`${p.username} tham gia`); broadcast('players', Object.keys(bot.players)) }})
  bot.on('playerLeft',   (p) => { if (p.username !== bot.username) { log.info(`${p.username} rời`);      broadcast('players', Object.keys(bot.players)) }})
  bot.on('health', () => {
    if (bot.health < 5) log.warn(`Máu thấp! HP: ${bot.health}/20`)
    if (bot.food  < 5)  log.warn(`Đói! Food: ${bot.food}/20`)
    broadcast('stats', getStats(bot))
  })

  setupConsoleInput(bot)
  return bot
}

// ─── Dashboard WebSocket Handler ──────────────────────────────────────────────
function handleDashboardAction(action, payload) {
  const bot = botInstance
  switch (action) {
    case 'connect':
      if (!botInstance) createBot()
      else log.warn('Bot đang chạy rồi!')
      break
    case 'disconnect':
      if (bot) { bot.quit(); log.info('Đã ngắt kết nối') }
      break
    case 'chat':
      if (bot && payload?.msg) { bot.chat(payload.msg); log.bot(`Chat: ${payload.msg}`) }
      break
    case 'come':
      if (bot) cmdComeToPlayer(bot, payload?.target)
      break
    case 'follow':
      if (bot) cmdFollow(bot, null, payload?.target)
      break
    case 'stop':
      if (bot) { bot.pathfinder.stop(); log.info('Dừng di chuyển') }
      break
    case 'jump':
      if (bot) { bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 300) }
      break
    case 'respawn':
      if (bot) bot.respawn()
      break
    case 'look_random':
      if (bot?.entity) bot.look(Math.random() * Math.PI * 2, 0, false)
      break
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function getStats(bot) {
  if (!bot?.entity) return {}
  const pos = bot.entity.position
  return {
    health:   bot.health || 0,
    food:     bot.food   || 0,
    x:        Math.floor(pos.x),
    y:        Math.floor(pos.y),
    z:        Math.floor(pos.z),
    players:  Object.keys(bot.players || {}),
    username: bot.username,
    ping:     bot.player?.ping || 0,
    xp:       bot.experience?.level || 0,
  }
}

// ─── In-game Commands ─────────────────────────────────────────────────────────
function handleCommands(bot, username, message) {
  const prefix  = config.prefix || '!'
  if (!message.startsWith(prefix)) return
  const isAdmin = config.admins?.includes(username)
  const args    = message.slice(prefix.length).trim().split(/\s+/)
  const cmd     = args[0].toLowerCase()

  switch (cmd) {
    case 'help':    bot.chat(`${prefix}help | ${prefix}pos | ${prefix}players | ${prefix}hi`); break
    case 'pos':     { const p = bot.entity.position; bot.chat(`X=${Math.floor(p.x)} Y=${Math.floor(p.y)} Z=${Math.floor(p.z)}`); break }
    case 'players': bot.chat(`Online: ${Object.keys(bot.players).join(', ')}`); break
    case 'hi':      bot.chat(`Chào ${username}! 👋`); break
  }

  if (!isAdmin) return

  switch (cmd) {
    case 'come':   cmdComeToPlayer(bot, username); break
    case 'stop':   bot.pathfinder.stop(); bot.chat('Đã dừng.'); break
    case 'say':    bot.chat(args.slice(1).join(' ')); break
    case 'look':   cmdLookAt(bot, username); break
    case 'follow': cmdFollow(bot, username, args[1] || username); break
    case 'status': bot.chat(`❤ ${bot.health}/20 | 🍖 ${bot.food}/20 | Ping: ${bot.player?.ping || '?'}ms`); break
    case 'quit':   bot.chat('Tạm biệt!'); setTimeout(() => bot.quit(), 1000); break
    case 'drop':   cmdDrop(bot, args[1]); break
  }
}

function cmdComeToPlayer(bot, username) {
  if (!username) return
  const player = bot.players[username]
  if (!player?.entity) { log.warn(`Không tìm thấy: ${username}`); return }
  const { x, y, z } = player.entity.position
  bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 2))
  log.info(`Di chuyển đến ${username}`)
}

function cmdFollow(bot, sender, targetName) {
  if (!targetName) return
  const player = bot.players[targetName]
  if (!player?.entity) { log.warn(`Không tìm thấy: ${targetName}`); return }
  bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 3), true)
  log.info(`Theo dõi ${targetName}`)
}

function cmdLookAt(bot, username) {
  const player = bot.players[username]
  if (player?.entity) bot.lookAt(player.entity.position.offset(0, 1.6, 0))
}

async function cmdDrop(bot, itemName) {
  if (!itemName) return
  const item = bot.inventory.items().find(i => i.name.includes(itemName))
  if (!item) { bot.chat(`Không có: ${itemName}`); return }
  await bot.toss(item.type, null, item.count)
  bot.chat(`Đã thả ${item.count}x ${item.name}`)
}

function setupAntiAfk(bot) {
  setInterval(() => {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 200)
    bot.look(bot.entity.yaw + (Math.random() - 0.5) * 0.4, bot.entity.pitch, false)
    log.bot('Anti-AFK ✓')
  }, config.antiAfkInterval || 60000)
}

function setupAutoRespawn(bot) {
  bot.on('death', () => setTimeout(() => { bot.respawn(); log.info('Tự hồi sinh') }, 2000))
}

function setupConsoleInput(bot) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: chalk.green('  > ') })
  rl.prompt()
  rl.on('line', (line) => {
    const input = line.trim()
    if (!input) { rl.prompt(); return }
    if (input.startsWith('/'))       bot.chat(input)
    else if (input === 'quit')       { bot.quit(); process.exit(0) }
    else if (input === 'pos')        { const p = bot.entity.position; log.info(`X=${Math.floor(p.x)} Y=${Math.floor(p.y)} Z=${Math.floor(p.z)}`) }
    else if (input === 'players')    log.info(Object.keys(bot.players).join(', '))
    else if (input === 'status')     log.info(`❤ ${bot.health}/20 | 🍖 ${bot.food}/20`)
    else                             bot.chat(input)
    rl.prompt()
  })
}

// ─── Start ────────────────────────────────────────────────────────────────────
printBanner()
const PORT = config.webPort || 3000
server.listen(PORT, () => {
  log.success(`Dashboard: http://localhost:${PORT}`)
  log.info('Đang khởi động bot...')
  createBot()
})
