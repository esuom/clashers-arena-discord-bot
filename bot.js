require("dotenv").config({ path: "./.env" });
const { 
  Client, 
  GatewayIntentBits, 
  Events, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require("discord.js");

const fetch = require("node-fetch");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers   // ← REQUIRED
  ]
});

async function assignVerifiedRole(interaction, caUsername) {
  const roleName = "Clashers Arena Verified";
  const guild = interaction.guild;
  if (!guild) return;

  const role = guild.roles.cache.find(r => r.name === roleName);
  if (!role) return;

  const member = await guild.members.fetch(interaction.user.id);

  // Assign role
  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role);
  }

  // Set nickname from Clashers Arena
  try {
    const newNick = `${caUsername}`;

    if (member.nickname !== newNick) {
      await member.setNickname(newNick);
    }
  } catch (err) {
    console.warn("Nickname set failed:", err.message);
  }
}


// READY
client.once(Events.ClientReady, async clientUser => {
  console.log(`✅ READY: Logged in as ${clientUser.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Test if the bot is responsive")
      .toJSON(),

    new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Link your Clashers Arena account")
      .addStringOption(option =>
        option
          .setName("code")
          .setDescription("Your 6-digit verification code")
          .setRequired(true)
      )
      .toJSON(),
      
    new SlashCommandBuilder()
  .setName("nextmatch")
  .setDescription("View your next scheduled league match")
  .toJSON(),


new SlashCommandBuilder()
  .setName("mystats")
  .setDescription("View your Clashers Arena stats")
  .toJSON(),

  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        clientUser.application.id,
        "1449124801322029158" // YOUR GUILD ID
      ),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error("❌ Command registration failed:", error);
  }
});

// HANDLE SLASH COMMANDS
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /ping
  if (interaction.commandName === "ping") {
    await interaction.reply("🏓 Pong!");
    return;
  }

  // /verify
  else if (interaction.commandName === "verify") {
    const code = interaction.options.getString("code");
    const discordId = interaction.user.id;

    try {
      const res = await fetch("https://theclashersarena.com/api/discord_verify.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.WEBHOOK_SECRET
        },
        body: JSON.stringify({
          code,
          discord_id: discordId
        })
      });

      const data = await res.json();

if (data.success) {
  try {
    await assignVerifiedRole(interaction, data.username);
  } catch (roleErr) {
    console.error("Role assignment failed:", roleErr);
    // verification already succeeded — do not fail user
  }

  await interaction.reply({
    content: "✅ Your Discord account has been linked and you are now **Clashers Arena Verified**!",
    ephemeral: true
  });
  return;
}
 else {
        await interaction.reply({
          content: "❌ Invalid or expired verification code.",
          ephemeral: true
        });
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "❌ Verification service unavailable.",
        ephemeral: true
      });
    }
  }

///////////
else if (interaction.commandName === "nextmatch") {
  const discordId = interaction.user.id;

  try {
    const res = await fetch("https://theclashersarena.com/api/discord_nextmatch.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.WEBHOOK_SECRET
      },
      body: JSON.stringify({ discord_id: discordId })
    });

    const data = await res.json();

    if (!data.success) {
      await interaction.reply({
        content: "📭 You have no upcoming scheduled matches.",
        ephemeral: true
      });
      return;
    }

    const match = data.match;
    const time = new Date(match.scheduled_for).toLocaleString();

    await interaction.reply({
      content:
        "🏟️ **Your Next Match**\n\n" +
        `**${match.player_a} vs ${match.player_b}**\n` +
        `🕒 **${time}**\n\n` +
        "Good luck! 🔥",
      ephemeral: true
    });

  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Unable to fetch your next match.",
      ephemeral: true
    });
  }
}
else if (interaction.commandName === "mystats") {
  const discordId = interaction.user.id;

  try {
    const res = await fetch("https://theclashersarena.com/api/discord_mystats.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.WEBHOOK_SECRET
      },
      body: JSON.stringify({ discord_id: discordId })
    });

   let data;
try {
  data = await res.json();
} catch (e) {
  console.error("Invalid JSON from /mystats");
  await interaction.reply({
    content: "❌ Stats service error. Please try again later.",
    ephemeral: true
  });
  return;
}


    if (!data.success) {
  const msg =
    data.reason === "no_active_season"
      ? "🕒 The season hasn’t started yet. Stats will appear once the season begins."
      : "❌ Stats not available. Make sure your account is linked.";

  await interaction.reply({ content: msg, ephemeral: true });
  return;
}


    await interaction.reply({
      content:
        "📊 **Your Clashers Arena Stats**\n\n" +
        `👤 **${data.username}**\n` +
        `🏆 Record: **${data.wins}–${data.losses}**\n` +
        `🔥 Win %: **${data.win_pct}%**\n` +
        `👑 Avg Crowns/Game: **${data.avg_crowns}**`,
      ephemeral: true
    });

  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Unable to load stats right now.",
      ephemeral: true
    });
  }
}

});

const express = require("express");
const app = express();
app.use(express.json());

// DM endpoint
app.post("/dm", async (req, res) => {
  if (req.headers.authorization !== process.env.WEBHOOK_SECRET) {
    return res.status(403).send("Forbidden");
  }

  const { discord_id, message } = req.body;

  try {
    const user = await client.users.fetch(discord_id);
    await user.send(message);
    res.json({ success: true });
  } catch (err) {
    console.error("DM failed:", err);
    res.status(500).json({ success: false });
  }
});

// RESULT POSTING endpoint
app.post("/post-result", async (req, res) => {
  if (req.headers.authorization !== process.env.WEBHOOK_SECRET) {
    return res.status(403).send("Forbidden");
  }

  const {
    match_id,
    channel_id,
    winner,
    loser,
    score,
    crowns,
    is_playoff
  } = req.body;

  const matchUrl = `https://theclashersarena.com/index.php?page=match_details&match_id=${match_id}`;

  try {
    const channel = await client.channels.fetch(channel_id);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const message =
      `🏆 **Match Result** ${is_playoff ? "🔥 *Playoffs*" : ""}\n\n` +
      `**${winner}** defeated **${loser}**\n` +
      `📊 Score: **${score}**\n` +
      `👑 Crowns: **${crowns}**\n\n` +
      `🔗 **View match details:**\n${matchUrl}`;

    await channel.send(message);

    res.json({ success: true });
  } catch (err) {
    console.error("Result post failed:", err);
    res.status(500).json({ success: false });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📬 DM webhook listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);

