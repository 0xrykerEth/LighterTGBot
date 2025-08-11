// Configuration file for LighterBot
// Copy this to .env and fill in your actual values

module.exports = {
    // Telegram Bot Configuration
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'your_bot_token_here',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || 'your_chat_id_here',
    
    // API Configuration
    API_URL: 'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails',
    
    // Monitoring Configuration
    CHECK_INTERVAL: '*/5 * * * *', // Every 5 minutes
    SYMBOLS_FILE: 'symbols.json'
};
