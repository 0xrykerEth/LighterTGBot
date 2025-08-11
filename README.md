# LighterBot 🤖

A Telegram bot that monitors the [zklighter](https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails) platform for new asset listings and sends notifications to users.

## Features

- 🔍 **Automatic Monitoring**: Checks for new assets every 5 minutes
- 📱 **Telegram Notifications**: Instant alerts when new assets are listed
- 💾 **Persistent Storage**: Saves all monitored symbols to a JSON file
- 📊 **Status Commands**: Check bot status and view all monitored symbols
- 🚨 **Real-time Alerts**: Immediate notification of new listings

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- A Telegram bot token
- Your Telegram chat ID

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

#### How to get Telegram Bot Token:

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the token provided

#### How to get Chat ID:

1. Message your bot
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat.id` field in the response

### 4. Run the Bot

```bash
# Start the bot
npm start

# Or run in development mode with auto-restart
npm run dev
```

## Bot Commands

- `/start` - Welcome message and bot information
- `/status` - Check current bot status and symbol count
- `/symbols` - List all monitored symbols
- `/check` - Manually check for new symbols

## How It Works

1. **Initialization**: Bot loads existing symbols from `symbols.json` (if exists)
2. **API Polling**: Every 5 minutes, fetches current asset list from zklighter API
3. **Comparison**: Compares new list with stored symbols
4. **Notification**: Sends Telegram message for any new assets found
5. **Storage**: Updates the JSON file with new symbols

## File Structure

```
lighterbot/
├── bot.js          # Main bot logic
├── config.js       # Configuration settings
├── package.json    # Dependencies and scripts
├── symbols.json    # Stored symbols (auto-generated)
└── README.md       # This file
```

## API Endpoint

The bot monitors: `https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails`

This endpoint returns a list of all trading pairs with their details including:
- Symbol name
- Market ID
- Trading status
- Fees and limits
- Volume and price data

## Monitoring Schedule

- **Check Interval**: Every 5 minutes
- **Cron Expression**: `*/5 * * * *`
- **Real-time**: Immediate notifications for new assets

## Error Handling

- API failures are logged and don't stop the bot
- Telegram message failures are logged
- File I/O errors are handled gracefully
- Bot continues running even if individual operations fail

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

This requires `nodemon` to be installed globally or as a dev dependency.

## Troubleshooting

### Bot not responding:
- Check if the bot token is correct
- Ensure the bot is running (`npm start`)
- Check console for error messages

### No notifications:
- Verify your chat ID is correct
- Make sure you've sent a message to the bot first
- Check if the API endpoint is accessible

### Missing symbols:
- The `symbols.json` file is created automatically
- First run will populate with all current symbols
- Subsequent runs will only detect new additions

## License

MIT License - feel free to modify and distribute as needed.
