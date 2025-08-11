require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUBSCRIBERS_FILE = 'subscribers.json';
const API_URL = 'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails';
const SYMBOLS_FILE = 'symbols.json';
const CHECK_INTERVAL = '*/5 * * * *'; // Every 5 minutes

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store for current symbols and subscribers
let currentSymbols = new Set();
let subscribers = new Set();

// Load existing symbols from file
function loadSymbols() {
    try {
        if (fs.existsSync(SYMBOLS_FILE)) {
            const data = fs.readFileSync(SYMBOLS_FILE, 'utf8');
            const symbols = JSON.parse(data);
            currentSymbols = new Set(symbols);
            console.log(`Loaded ${symbols.length} existing symbols`);
        }
    } catch (error) {
        console.error('Error loading symbols:', error);
        currentSymbols = new Set();
    }
}

// Load subscribers from file
function loadSubscribers() {
    try {
        if (fs.existsSync(SUBSCRIBERS_FILE)) {
            const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
            const subList = JSON.parse(data);
            subscribers = new Set(subList);
            console.log(`Loaded ${subList.length} existing subscribers`);
        }
    } catch (error) {
        console.error('Error loading subscribers:', error);
        subscribers = new Set();
    }
}

// Save symbols to file
function saveSymbols() {
    try {
        const symbols = Array.from(currentSymbols);
        fs.writeFileSync(SYMBOLS_FILE, JSON.stringify(symbols, null, 2));
        console.log(`Saved ${symbols.length} symbols to file`);
    } catch (error) {
        console.error('Error saving symbols:', error);
    }
}

// Save subscribers to file
function saveSubscribers() {
    try {
        const subList = Array.from(subscribers);
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subList, null, 2));
        console.log(`Saved ${subList.length} subscribers to file`);
    } catch (error) {
        console.error('Error saving subscribers:', error);
    }
}

// Add new subscriber
function addSubscriber(chatId) {
    if (!subscribers.has(chatId)) {
        subscribers.add(chatId);
        saveSubscribers();
        console.log(`New subscriber added: ${chatId}`);
        return true;
    }
    return false;
}

// Remove subscriber
function removeSubscriber(chatId) {
    if (subscribers.has(chatId)) {
        subscribers.delete(chatId);
        saveSubscribers();
        console.log(`Subscriber removed: ${chatId}`);
        return true;
    }
    return false;
}

// Broadcast message to all subscribers
async function broadcastMessage(message) {
    const failedChats = [];
    
    for (const chatId of subscribers) {
        try {
            await bot.sendMessage(chatId, message);
            console.log(`Message sent to ${chatId}`);
        } catch (error) {
            console.error(`Failed to send message to ${chatId}:`, error.message);
            failedChats.push(chatId);
        }
    }
    
    // Remove failed chats (bot blocked, chat deleted, etc.)
    if (failedChats.length > 0) {
        failedChats.forEach(chatId => removeSubscriber(chatId));
        console.log(`Removed ${failedChats.length} failed subscribers`);
    }
    
    return subscribers.size;
}

// Broadcast message with inline keyboard buttons to all subscribers
async function broadcastMessageWithButtons(message, inlineKeyboard) {
    const failedChats = [];
    
    for (const chatId of subscribers) {
        try {
            await bot.sendMessage(chatId, message, {
                reply_markup: inlineKeyboard
            });
            console.log(`Message with buttons sent to ${chatId}`);
        } catch (error) {
            console.error(`Failed to send message with buttons to ${chatId}:`, error.message);
            failedChats.push(chatId);
        }
    }
    
    // Remove failed chats (bot blocked, chat deleted, etc.)
    if (failedChats.length > 0) {
        failedChats.forEach(chatId => removeSubscriber(chatId));
        console.log(`Removed ${failedChats.length} failed subscribers`);
    }
    
    return subscribers.size;
}

// Fetch current symbols from API
async function fetchSymbols() {
    try {
        const response = await axios.get(API_URL);
        
        if (response.data.code === 200 && response.data.order_book_details) {
            const symbols = response.data.order_book_details.map(item => item.symbol);
            return symbols;
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('Error fetching symbols:', error.message);
        return null;
    }
}

// Check for new symbols
async function checkForNewSymbols() {
    console.log('Checking for new symbols...');
    
    const apiSymbols = await fetchSymbols();
    if (!apiSymbols) {
        console.log('Failed to fetch symbols, skipping check');
        return;
    }

    const newSymbols = [];
    
    for (const symbol of apiSymbols) {
        if (!currentSymbols.has(symbol)) {
            newSymbols.push(symbol);
            currentSymbols.add(symbol);
        }
    }

    if (newSymbols.length > 0) {
        console.log(`Found ${newSymbols.length} new symbols:`, newSymbols);
        
        // Send notification to all subscribers
        const message = `🚨 New assets listed on zklighter!\n\n${newSymbols.map(s => `• ${s}`).join('\n')}\n\nTotal assets: ${currentSymbols.size}`;
        
        // Create inline keyboard buttons for each new symbol
        const keyboard = newSymbols.map(symbol => [{
            text: `🔗 TRADE ${symbol}`,
            url: `https://app.lighter.xyz/trade/${symbol}`
        }]);
        
        const inlineKeyboard = {
            inline_keyboard: keyboard
        };
        
        try {
            const sentCount = await broadcastMessageWithButtons(message, inlineKeyboard);
            console.log(`Notification sent to ${sentCount} subscribers`);
        } catch (error) {
            console.error('Error broadcasting message:', error);
        }
        
        // Save updated symbols
        saveSymbols();
    } else {
        console.log('No new symbols found');
    }
}

// Bot command handlers
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const isNewSubscriber = addSubscriber(chatId);
    
    let welcomeMessage;
    if (isNewSubscriber) {
        welcomeMessage = `🤖 Welcome to LighterBot!\n\n✅ You've been subscribed to receive notifications about new asset listings on zklighter!\n\nI'll check for new assets every 5 minutes and notify you immediately when new ones are found.\n\nCommands:\n/status - Check current status\n/symbols - List all monitored symbols\n/unsubscribe - Stop receiving notifications`;
    } else {
        welcomeMessage = `🤖 Welcome back to LighterBot!\n\nYou're already subscribed to receive notifications about new asset listings on zklighter.\n\nCommands:\n/status - Check current status\n/symbols - List all monitored symbols\n/unsubscribe - Stop receiving notifications`;
    }
    
    await bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/unsubscribe/, async (msg) => {
    const chatId = msg.chat.id;
    const wasRemoved = removeSubscriber(chatId);
    
    if (wasRemoved) {
        await bot.sendMessage(chatId, '❌ You have been unsubscribed from LighterBot notifications.\n\nSend /start again if you want to resubscribe.');
    } else {
        await bot.sendMessage(chatId, '❌ You were not subscribed to LighterBot notifications.');
    }
});

bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const statusMessage = `📊 Bot Status\n\n• Total symbols monitored: ${currentSymbols.size}\n• Total subscribers: ${subscribers.size}\n• Last check: ${new Date().toLocaleString()}\n• Monitoring: Active`;
    
    await bot.sendMessage(chatId, statusMessage);
});

bot.onText(/\/symbols/, async (msg) => {
    const chatId = msg.chat.id;
    const symbols = Array.from(currentSymbols).sort();
    
    if (symbols.length === 0) {
        await bot.sendMessage(chatId, 'No symbols loaded yet. Please wait for the first check.');
        return;
    }
    
    // Split into chunks if too many symbols
    const chunkSize = 50;
    for (let i = 0; i < symbols.length; i += chunkSize) {
        const chunk = symbols.slice(i, i + chunkSize);
        const message = `📋 Symbols (${i + 1}-${Math.min(i + chunkSize, symbols.length)} of ${symbols.length}):\n\n${chunk.join(', ')}`;
        await bot.sendMessage(chatId, message);
    }
});



// Admin command to see subscriber count
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Simple admin check - you can modify this logic
    if (chatId.toString() === process.env.ADMIN_CHAT_ID) {
        const adminMessage = `👑 Admin Panel\n\n• Total subscribers: ${subscribers.size}\n• Total symbols: ${currentSymbols.size}\n• Bot uptime: ${process.uptime().toFixed(0)}s`;
        await bot.sendMessage(chatId, adminMessage);
    } else {
        await bot.sendMessage(chatId, '❌ Access denied. Admin only command.');
    }
});

// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Initialize bot
async function initializeBot() {
    try {
        // Load existing data
        loadSymbols();
        loadSubscribers();
        
        // Perform initial check
        await checkForNewSymbols();
        
        // Schedule periodic checks
        cron.schedule(CHECK_INTERVAL, checkForNewSymbols);
        
        console.log('Bot initialized successfully');
        console.log(`Monitoring ${currentSymbols.size} symbols`);
        console.log(`Active subscribers: ${subscribers.size}`);
        console.log(`Scheduled checks every 5 minutes`);
        
    } catch (error) {
        console.error('Error initializing bot:', error);
        process.exit(1);
    }
}

// Start the bot
console.log('Starting LighterBot...');
initializeBot();
