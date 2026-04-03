const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

client.on("ready", () => {
  console.log(`✅ Deal bot is online as ${client.user.tag}`);
  console.log(`📡 Watching channel: ${CHANNEL_ID}`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL ? "SET" : "MISSING"}`);
  console.log(`🔑 Webhook Secret: ${WEBHOOK_SECRET ? "SET" : "MISSING"}`);
});

client.on("messageCreate", async (message) => {
  console.log(`📨 Message received in channel ${message.channel.id} from ${message.author.tag}: "${message.content.substring(0, 50)}"`);

  if (message.author.bot) {
    console.log("⏭️ Skipping bot message");
    return;
  }

  if (CHANNEL_ID && message.channel.id !== CHANNEL_ID) {
    console.log(`⏭️ Wrong channel (expected ${CHANNEL_ID}, got ${message.channel.id})`);
    return;
  }

  const dealMatch = message.content.match(/\$[\d,]+/);
  if (!dealMatch) {
    console.log("⏭️ No deal pattern found");
    return;
  }

  const member = message.member;
  if (!member) {
    console.log("⏭️ No member data");
    return;
  }

  const roles = member.roles.cache.map((r) => r.name.toUpperCase());
  console.log(`👤 Roles: ${roles.join(", ")}`);

  const hasRole = roles.some(
    (r) => r.includes("INFINITE AGENT") || r.includes("RYSE AGENT")
  );

  if (!hasRole) {
    console.log("⏭️ User doesn't have required role");
    return;
  }

  const rawName = member.nickname || message.author.globalName || message.author.username;
  const author = rawName.replace(/\s*\|\s*(ryse|infinite)\s*/i, "").trim();
  console.log(`✅ Processing deal from: ${author}`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET || "",
      },
      body: JSON.stringify({
        author: author,
        message: message.content,
      }),
    });

    const result = await response.json();
    console.log(`📤 Webhook response (${response.status}):`, JSON.stringify(result));

    if (response.ok) {
      await message.react("✅");
    } else {
      await message.react("❌");
    }
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    await message.react("❌");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
