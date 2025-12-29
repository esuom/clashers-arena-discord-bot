Discord Bot - Clash League (Minimal)
------------------------------------
This Node.js Discord bot provides:
- /standings <division_id> - posts standings (requires webhook from CMS or direct DB)
- /report <match_id> <p1wins> <p2wins> <p1crowns> <p2crowns> - reports a match to the CMS via webhook

Quickstart:
1. Create a Discord application & bot, invite it to your server with applications.commands permissions.
2. Copy config.example.json to config.json and fill in BOT_TOKEN and CMS_WEBHOOK_URL.
3. Run `npm install` then `node bot.js`

Note: For production use, host this on a small VPS and register slash commands properly.
