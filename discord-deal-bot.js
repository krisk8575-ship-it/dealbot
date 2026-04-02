const { Client, GatewayIntentBits } = require('discord.js');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://dwascktlqsyzgyijadki.supabase.co/functions/v1/discord-deals';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const ALLOWED_ROLES = ['INFINITE AGENT', 'RYSE AGENT'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`✅ Deal bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Ignore bots and other channels
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  // Only process messages that look like deals (contain a dollar amount)
  if (!/\$[\d,]+/.test(message.content)) return;

  try {
    // Check if user has an allowed role
    const member = message.member || await message.guild.members.fetch(message.author.id);
    const hasAllowedRole = member.roles.cache.some(role =>
      ALLOWED_ROLES.some(allowed => role.name.toUpperCase() === allowed.toUpperCase())
    );

    if (!hasAllowedRole) {
      // Silently skip — not on your team
      return;
    }

    // Get nickname, strip "| Ryse" or "| Infinite" suffix
    const rawName = member.nickname || message.author.globalName || message.author.username;
    const author = rawName.replace(/\s*\|\s*(ryse|infinite)\s*/i, '').trim();

    // Forward to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        author: author,
        message: message.content,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      await message.react('✅');
      console.log(`✅ Deal logged for ${author}: ${message.content}`);
    } else {
      await message.react('❌');
      console.error(`❌ Failed for ${author}:`, result);
    }
  } catch (err) {
    console.error('Error processing deal:', err);
    await message.react('❌');
  }
});

client.login(BOT_TOKEN);
