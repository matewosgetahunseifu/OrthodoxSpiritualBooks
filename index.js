const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const ADMIN_IDS = [7480368503];
const ADMIN_USERNAME = "@Sealilenemariyammsle12we19";
const PORT = process.env.PORT || 3000;
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;
const PREVIEW_PAGES = 25;

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const bot = new Telegraf(BOT_TOKEN);

// ==========================================
// 2. EXPRESS SERVER (For Render Uptime)
// ==========================================
const app = express();

app.get('/', (req, res) => res.send('✅ Bot is running!'));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/ping', (req, res) => res.status(200).send('Pong'));

app.listen(PORT, () => console.log(`🌐 Server on port ${PORT}`));

setInterval(async () => {
  const serverUrl = process.env.RENDER_EXTERNAL_URL;
  if (serverUrl) {
    try {
      if (globalThis.fetch) await globalThis.fetch(`${serverUrl}/ping`);
    } catch (err) { /* ignore */ }
  }
}, 3 * 60 * 1000);

// ==========================================
// 3. DATABASE LAYER (Supabase or fallback JSON)
// ==========================================
const DATA_FILE = path.join(__dirname, 'database.json');
let db = null;

// --- Supabase helpers ---
async function supabaseGetBooks(category) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('category', category)
    .order('order', { ascending: true });
  if (error) { console.error('Supabase getBooks error:', error); return null; }
  return data;
}

async function supabaseGetBook(id) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function supabaseAddBook(book) {
  if (!supabase) return null;
  const { data: existing } = await supabase
    .from('books')
    .select('order')
    .eq('category', book.category)
    .order('order', { ascending: false })
    .limit(1);
  const nextOrder = (existing && existing.length) ? existing[0].order + 1 : 1;
  const { data, error } = await supabase.from('books').insert([{ ...book, order: nextOrder }]).select();
  if (error) { console.error('Supabase addBook error:', error); return null; }
  return data[0];
}

async function supabaseRemoveBook(id) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('books').delete().eq('id', id).select();
  if (error) { console.error('Supabase removeBook error:', error); return null; }
  return data;
}

async function supabaseReorderBooks(category, orderedIds) {
  if (!supabase) return null;
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('books')
      .update({ order: i + 1 })
      .eq('id', orderedIds[i]);
    if (error) { console.error('Supabase reorder error:', error); return null; }
  }
  return true;
}

// --- Local JSON fallback ---
const booksDatabase = {};

function loadLocalDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.books) Object.assign(booksDatabase, parsed.books);
      return parsed;
    }
  } catch (e) { console.log('⚠️ Local DB load error:', e.message); }
  return { users: {}, pendingReceipts: {}, feedback: [], bookStats: {}, userActivity: {}, books: booksDatabase };
}

function saveLocalDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      users: db ? db.users : {},
      pendingReceipts: db ? db.pendingReceipts : {},
      feedback: db ? db.feedback : [],
      bookStats: db ? db.bookStats : {},
      userActivity: db ? db.userActivity : {},
      books: booksDatabase
    }, null, 2), 'utf8');
    console.log('✅ Local database saved');
  } catch (e) { console.log('❌ Local DB save error:', e.message); }
}

// Init db
if (supabase) {
  console.log('✅ Using Supabase as database.');
  db = { users: {}, pendingReceipts: {}, feedback: [], bookStats: {}, userActivity: {} };
} else {
  console.log('📁 Using local JSON database (fallback).');
  db = loadLocalDatabase();
}

// --- Public functions ---
async function getBooks(category) {
  if (supabase) {
    const result = await supabaseGetBooks(category);
    return result || [];
  }
  return booksDatabase[category] || [];
}

async function getBook(id) {
  if (supabase) {
    return await supabaseGetBook(id);
  }
  for (const cat of Object.keys(booksDatabase)) {
    const found = booksDatabase[cat].find(b => b.id === id);
    if (found) return found;
  }
  return null;
}

async function addBook(book) {
  if (supabase) {
    return await supabaseAddBook(book);
  }
  if (!booksDatabase[book.category]) booksDatabase[book.category] = [];
  booksDatabase[book.category].push(book);
  saveLocalDatabase();
  return book;
}

async function removeBook(id) {
  if (supabase) {
    return await supabaseRemoveBook(id);
  }
  for (const cat of Object.keys(booksDatabase)) {
    const idx = booksDatabase[cat].findIndex(b => b.id === id);
    if (idx !== -1) {
      const removed = booksDatabase[cat].splice(idx, 1)[0];
      saveLocalDatabase();
      return removed;
    }
  }
  return null;
}

async function reorderBooks(category, orderedIds) {
  if (supabase) {
    return await supabaseReorderBooks(category, orderedIds);
  }
  if (!booksDatabase[category]) return false;
  const newBooks = [];
  for (const id of orderedIds) {
    const book = booksDatabase[category].find(b => b.id === id);
    if (book) newBooks.push(book);
  }
  const remaining = booksDatabase[category].filter(b => !orderedIds.includes(b.id));
  booksDatabase[category] = [...newBooks, ...remaining];
  saveLocalDatabase();
  return true;
}

// ==========================================
// 4. ADD BOOK SESSIONS
// ==========================================
const addBookSessions = {};

// ==========================================
// 5. OTHER HELPERS
// ==========================================
function isAdmin(userId) { return ADMIN_IDS.includes(userId); }
function isPaidUser(userId) {
  if (isAdmin(userId)) return true;
  return db.users[userId] && db.users[userId].is_paid === true;
}
function registerUser(from) {
  if (!db.users[from.id]) {
    db.users[from.id] = {
      username: from.username ? `@${from.username}` : "No Username",
      is_paid: false,
      registration_date: new Date().toISOString(),
      preferred_language: null,
      total_downloads: 0,
      books_downloaded: []
    };
    if (!supabase) saveLocalDatabase();
    logActivity(from.id, 'register', { username: from.username });
    return true;
  }
  return false;
}
function markUserPaid(userId) {
  if (!db.users[userId]) db.users[userId] = { is_paid: true };
  else db.users[userId].is_paid = true;
  if (!supabase) saveLocalDatabase();
  logActivity(userId, 'payment_approved', { status: 'paid' });
}
function trackDownload(userId, catKey, bookId) {
  if (!db.users[userId]) return;
  db.users[userId].total_downloads = (db.users[userId].total_downloads || 0) + 1;
  if (!db.users[userId].books_downloaded) db.users[userId].books_downloaded = [];
  const bookKey = `${catKey}_${bookId}`;
  if (!db.users[userId].books_downloaded.includes(bookKey)) {
    db.users[userId].books_downloaded.push(bookKey);
  }
  if (!db.bookStats) db.bookStats = {};
  if (!db.bookStats[bookKey]) db.bookStats[bookKey] = 0;
  db.bookStats[bookKey]++;
  if (!supabase) saveLocalDatabase();
  logActivity(userId, 'download_book', { catKey, bookId });
}
function getUserStats(userId) {
  const user = db.users[userId];
  if (!user) return null;
  return {
    username: user.username,
    is_paid: user.is_paid,
    registration_date: user.registration_date,
    total_downloads: user.total_downloads || 0,
    books_downloaded: user.books_downloaded ? user.books_downloaded.length : 0,
    preferred_language: user.preferred_language || 'Not set'
  };
}
function logActivity(userId, action, details) {
  try {
    const logFile = path.join(__dirname, 'activity.log');
    const entry = `[${new Date().toISOString()}] User: ${userId} | ${action} | ${JSON.stringify(details)}\n`;
    fs.appendFileSync(logFile, entry);
  } catch (e) { /* ignore */ }
}
function logError(type, error) {
  try {
    const logFile = path.join(__dirname, 'error.log');
    const entry = `[${new Date().toISOString()}] ${type}: ${error.stack || error}\n`;
    fs.appendFileSync(logFile, entry);
  } catch (e) { /* ignore */ }
}

// ==========================================
// 6. RATE LIMITING
// ==========================================
const userRequests = {};
function checkRateLimit(userId) {
  const now = Date.now();
  if (!userRequests[userId]) userRequests[userId] = [];
  userRequests[userId] = userRequests[userId].filter(t => now - t < 60000);
  if (userRequests[userId].length >= RATE_LIMIT) return false;
  userRequests[userId].push(now);
  return true;
}
function checkRateLimitCallback(ctx) {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    ctx.answerCbQuery("⏳ Please wait a moment.");
    return false;
  }
  return true;
}

// ==========================================
// 7. MAIN KEYBOARD & COMMANDS
// ==========================================
const mainKeyboard = Markup.keyboard([
  ['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ'],
  ['📞 አግኙኝ', '💬 አስተያየት'],
  ['📊 ስታቲስቲክስ', '🔄 ዳግም ጀምር']
]).resize();

bot.start((ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  registerUser(ctx.from);
  const user = db.users[userId];
  let msg = "እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት መጡ! 📚✨\n\n";
  msg += user.is_paid ? "✅ ክፍያ ፈጽመዋል! ሁሉንም መጽሐፍት ማውረድ ይችላሉ።\n" : "💰 200 ብር ክፈሉ።\n";
  msg += `📚 እስካሁን ${user.total_downloads || 0} መጽሐፍት አውርደዋል።`;
  ctx.reply(msg, mainKeyboard);
});

bot.hears('📚 መጽሐፍት', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  registerUser(ctx.from);
  const user = db.users[userId];
  if (user.preferred_language) {
    const lang = user.preferred_language;
    if (lang === 'geez') {
      ctx.reply("በግዕዝ ምድብ ይምረጡ:", Markup.inlineKeyboard([
        [Markup.button.callback("ሕግና ሥርዓት", "cat_geez_law")],
        [Markup.button.callback("ታሪክና ድርሳናት", "sub_geez_hist")],
        [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_geez_bible")],
        [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
      ]));
      return;
    } else if (lang === 'geez_amharic') {
      ctx.reply("በግዕዝ አማርኛ ምድብ ይምረጡ:", Markup.inlineKeyboard([
        [Markup.button.callback("ሕግና ሥርዓት", "cat_ga_law")],
        [Markup.button.callback("ታሪክና ድርሳናት", "sub_ga_hist")],
        [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_ga_bible")],
        [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
      ]));
      return;
    } else if (lang === 'amharic') {
      ctx.reply("በአማርኛ ምድብ ይምረጡ:", Markup.inlineKeyboard([
        [Markup.button.callback("ሕግና ሥርዓት", "cat_amh_law")],
        [Markup.button.callback("ታሪክና ድርሳናት", "sub_amh_hist")],
        [Markup.button.callback("ክርስቲያናዊ ሥነ ምግባር", "cat_amh_eth")],
        [Markup.button.callback("የመጽሐፍ ቅዱስ ጥናት", "sub_amh_bible")],
        [Markup.button.callback("ነገረ ሃይማኖት", "sub_amh_theology")],
        [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
      ]));
      return;
    } else if (lang === 'english') {
      ctx.reply("Select category:", Markup.inlineKeyboard([
        [Markup.button.callback("Law & Order", "cat_eng_law")],
        [Markup.button.callback("History & Discourse", "sub_eng_hist")],
        [Markup.button.callback("Christian Ethics", "cat_eng_eth")],
        [Markup.button.callback("Bible Study", "sub_eng_bible")],
        [Markup.button.callback("Theology & Dogma", "sub_eng_theology")],
        [Markup.button.callback("⬅️ Back", "back_to_lang")]
      ]));
      return;
    }
  }
  ctx.reply("እባኮን ቋንቋ ይምረጡ:", Markup.inlineKeyboard([
    [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
    [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
    [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("In English", "lang_eng")]
  ]));
});

bot.hears('📊 ስታቲስቲክስ', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  if (!stats) return ctx.reply("❌ መረጃ አልተገኘም።");
  ctx.reply(
    `📊 **Your Stats**\n\n👤 ${stats.username}\n💰 ${stats.is_paid ? '✅ Paid' : '❌ Not Paid'}\n📚 ${stats.total_downloads} downloads\n📖 ${stats.books_downloaded} unique books\n🌍 ${stats.preferred_language}`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📞 አግኙኝ', (ctx) => ctx.reply(`📞 ${ADMIN_USERNAME}\n📧 matewosgetahunseifu@gmail.com`));
bot.hears('💬 አስተያየት', (ctx) => ctx.reply(`💬 ${ADMIN_USERNAME}\n📧 matewosgetahunseifu@gmail.com`));
bot.hears('🔄 ዳግም ጀምር', (ctx) => ctx.reply("እንኳን ደህና መጡ!", mainKeyboard));
bot.hears(/^start$/i, (ctx) => {
  ctx.reply("👋 እንኳን ደህና መጡ! እባክዎትን ከስር ያሉትን ቁልፎች ይጫኑ:", mainKeyboard);
});

// ==========================================
// 8. COMMANDS
// ==========================================
bot.command('help', (ctx) => {
  ctx.reply(
    `📖 **Orthodox Spiritual Books Bot – Help**\n\n` +
    `📚 Use the main menu to browse books by language.\n` +
    `💰 Pay 200 ETB once to unlock all books.\n` +
    `📸 Send a bank receipt (photo or PDF) to this bot.\n` +
    `🔍 Type any book title to search.\n` +
    `📊 Use /stats to see your downloads.\n` +
    `👑 Admins: /addbook, /removebook, /orderbook, /backup, /stats\n` +
    `❓ Questions? Contact ${ADMIN_USERNAME}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('bookcount', async (ctx) => {
  const allCats = ['geez_law','geez_hist','geez_gdsl','geez_ot','geez_nt','ga_law','ga_hist','ga_gdsl','ga_ot','ga_nt','geez_edu','amh_law','amh_hist','amh_gdsl','amh_eth','amh_ot','amh_nt','amh_std','amh_chr','amh_mry','amh_snt','amh_thl','eng_law','eng_hist','eng_eth','eng_ot','eng_gdsl','eng_nt','eng_std','eng_chr','eng_mry','eng_snt','eng_thl'];
  let total = 0;
  let msg = '📚 **Book Count**\n\n';
  for (const cat of allCats) {
    const books = await getBooks(cat);
    if (books && books.length > 0) {
      total += books.length;
      msg += `• ${cat}: ${books.length}\n`;
    }
  }
  msg += `\n**Total books: ${total}**`;
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('popular', async (ctx) => {
  if (!db.bookStats || Object.keys(db.bookStats).length === 0) {
    return ctx.reply('No download data yet.');
  }
  const sorted = Object.entries(db.bookStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let msg = '🏆 **Most Downloaded Books**\n\n';
  for (const [key, count] of sorted) {
    const [cat, id] = key.split('_');
    const book = await getBook(id);
    if (book) {
      msg += `• ${book.title} (${cat}) – ${count} downloads\n`;
    }
  }
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('random', async (ctx) => {
  const allCats = ['geez_law','geez_hist','geez_gdsl','geez_ot','geez_nt','ga_law','ga_hist','ga_gdsl','ga_ot','ga_nt','geez_edu','amh_law','amh_hist','amh_gdsl','amh_eth','amh_ot','amh_nt','amh_std','amh_chr','amh_mry','amh_snt','amh_thl','eng_law','eng_hist','eng_eth','eng_ot','eng_gdsl','eng_nt','eng_std','eng_chr','eng_mry','eng_snt','eng_thl'];
  let allBooks = [];
  for (const cat of allCats) {
    const books = await getBooks(cat);
    if (books && books.length > 0) allBooks = allBooks.concat(books);
  }
  if (allBooks.length === 0) return ctx.reply('No books available.');
  const book = allBooks[Math.floor(Math.random() * allBooks.length)];
  ctx.reply(`📖 **Random Book:**\n\n${book.title}\nCategory: ${book.category}\n\nClick below to read it.`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📖 Read", `gb_${book.category}_${book.id}`)]
    ])
  });
});

bot.command('addbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return ctx.reply("⛔ Admin only!");
  if (addBookSessions[userId]) return ctx.reply("⚠️ Already adding a book. Use /canceladd to stop.");
  addBookSessions[userId] = { step: 'title' };
  ctx.reply(
    `📚 **Add a New Book**\n\n**Step 1: Enter Book Title**\n\n✏️ Type the title.\nExample: \`ድርሳነ ሚካኤል ብራና\``,
    { parse_mode: 'Markdown' }
  );
});

bot.command('canceladd', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.reply("❌ Cancelled.");
  } else {
    ctx.reply("⚠️ No active add-book session.");
  }
});

bot.command('removebook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return ctx.reply("⛔ Admin only!");
  if (addBookSessions[userId]) return ctx.reply("⚠️ You are already in another session. Use /canceladd first.");
  addBookSessions[userId] = { step: 'remove_waiting' };
  ctx.reply("🗑️ **Remove a Book**\n\nEnter the **book ID** to remove (e.g., `amh_law_1`).\nType `/cancel` to abort.");
});

bot.command('orderbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return ctx.reply("⛔ Admin only!");
  if (addBookSessions[userId]) return ctx.reply("⚠️ You are already in another session.");
  addBookSessions[userId] = { step: 'order_waiting' };
  ctx.reply(
    "🔄 **Reorder Books**\n\n" +
    "Enter the **category** and the new order as a list of book IDs.\n\n" +
    "Example:\n`amh_law 3 1 5 2 4`\n\n" +
    "This will reorder books in the `amh_law` category so that book ID 3 becomes first, ID 1 second, etc.\n\n" +
    "Type `/cancel` to abort."
  );
});

bot.command('cancel', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.reply("❌ Cancelled.");
  } else {
    ctx.reply("⚠️ No active session.");
  }
});

bot.command('stats', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const total = Object.keys(db.users).length;
  const paid = Object.values(db.users).filter(u => u.is_paid).length;
  ctx.reply(
    `📊 **Stats**\n\n👤 Total: ${total}\n💰 Paid: ${paid}\n📖 Free: ${total - paid}\n📁 Books: (use /bookcount for details)`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('backup', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    const backupData = supabase ? { 
      message: "Using Supabase – run /bookcount for book list", 
      users: db.users, 
      pendingReceipts: db.pendingReceipts,
      bookStats: db.bookStats
    } : db;
    ctx.replyWithDocument({
      source: Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8'),
      filename: `backup_${Date.now()}.json`
    }, { caption: "📦 Database Backup" });
  } catch (e) {
    ctx.reply("❌ Backup failed.");
  }
});

// ==========================================
// 9. CATEGORY ROUTING
// ==========================================
const allCategories = ['geez_law','geez_hist','geez_gdsl','geez_ot','geez_nt','ga_law','ga_hist','ga_gdsl','ga_ot','ga_nt','geez_edu','amh_law','amh_hist','amh_gdsl','amh_eth','amh_ot','amh_nt','amh_std','amh_chr','amh_mry','amh_snt','amh_thl','eng_law','eng_hist','eng_eth','eng_ot','eng_gdsl','eng_nt','eng_std','eng_chr','eng_mry','eng_snt','eng_thl'];

bot.action(/^cat_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const catKey = ctx.match[1];
  const books = await getBooks(catKey);
  if (!books || books.length === 0) {
    return ctx.answerCbQuery("ምንም መጽሐፍ የለም", { show_alert: true });
  }
  const buttons = books.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${catKey}_${book.id}`)
  ]);
  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);
  ctx.editMessageText("መጽሐፍ ይምረጡ:", Markup.inlineKeyboard(buttons));
});

bot.action(/^gb_(.+)_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = await getBook(bookId);
  if (!book) return ctx.answerCbQuery("መጽሐፉ አልተገኘም", { show_alert: true });

  if (!isPaidUser(userId)) {
    return ctx.reply(
      `📖 **${book.title}**\n\n` +
      `🔒 This book is locked. Pay **200 ETB** once to unlock all books.\n\n` +
      `💳 Payment methods:\n` +
      `• Ahadu Bank: 0100775011101\n` +
      `• CBE: 1000661046841\n` +
      `• Abyssinia Bank: 57080698\n` +
      `• Telebirr: 0943910036\n\n` +
      `👤 Account name: Matewos Getahun Seifu\n\n` +
      `📸 After payment, send the receipt (photo/PDF) to this bot. I will approve it manually.\n\n` +
      `👁 Click below to preview the first pages.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback("👁 Preview", `preview_${catKey}_${bookId}`)]
        ])
      }
    );
  }

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨`,
    protect_content: true
  }).then(() => {
    trackDownload(userId, catKey, bookId);
  }).catch((error) => {
    console.error('Error sending book:', error);
    ctx.reply(`❌ Error sending book. Try again later.`);
  });
});

bot.action(/^preview_(.+)_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = await getBook(bookId);
  if (!book) return ctx.reply("❌ መጽሐፉ አልተገኘም።");

  let previewText = `📖 **${book.title}**\n\n📄 **Preview (Pages 1-${PREVIEW_PAGES}):**\n\n`;
  for (let i = 1; i <= Math.min(PREVIEW_PAGES, 10); i++) {
    previewText += `📄 **Page ${i}:**\n${book.preview || 'This page contains spiritual teachings...'}\n\n`;
  }
  previewText += `\n━━━━━━━━━━━━━━━━━━━━━\n🔒 ሙሉውን መጽሐፍ ለማንበብ ክፍያ ይፈጽሙ።\n━━━━━━━━━━━━━━━━━━━━━`;

  ctx.reply(previewText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📖 Read Full Book", `gb_${catKey}_${bookId}`)],
      [Markup.button.callback("⬅️ Go Back", `cat_${catKey}`)]
    ])
  });
});

// ==========================================
// 10. TEXT HANDLER (FIXED!)
// ==========================================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  console.log(`📝 Message from ${userId}: "${text}"`);
  logActivity(userId, 'text_received', { text });

  // ---- CANCEL ----
  if (text === '/cancel' && addBookSessions[userId]) {
    delete addBookSessions[userId];
    return ctx.reply("❌ Cancelled.");
  }

  // ---- ADD BOOK FLOW ----
  if (addBookSessions[userId]) {
    const session = addBookSessions[userId];

    if (session.step === 'title') {
      session.title = text.trim();
      session.step = 'preview';
      session.preview = '';
      return ctx.reply(
        `✅ Title: \`${session.title}\`\n\n📄 **Step 2: Enter Preview**\n\n✏️ Type preview. Type \`/done\` when finished.`,
        { parse_mode: 'Markdown' }
      );
    }

    if (session.step === 'preview') {
      if (text === '/done') {
        if (!session.preview || session.preview.trim().length < 10) {
          return ctx.reply("⚠️ Preview too short! Please write at least 10 characters.");
        }
        session.step = 'category';
        const categories = ['geez_law','geez_hist','geez_gdsl','geez_ot','geez_nt','ga_law','ga_hist','ga_gdsl','ga_ot','ga_nt','geez_edu','amh_law','amh_hist','amh_gdsl','amh_eth','amh_ot','amh_nt','amh_std','amh_chr','amh_mry','amh_snt','amh_thl','eng_law','eng_hist','eng_eth','eng_ot','eng_gdsl','eng_nt','eng_std','eng_chr','eng_mry','eng_snt','eng_thl'];
        const buttons = [];
        for (let i = 0; i < categories.length; i += 2) {
          const row = [];
          row.push(Markup.button.callback(categories[i], `addcat_${categories[i]}`));
          if (i+1 < categories.length) row.push(Markup.button.callback(categories[i+1], `addcat_${categories[i+1]}`));
          buttons.push(row);
        }
        buttons.push([Markup.button.callback("❌ Cancel", "cancel_add_book")]);
        return ctx.reply(`✅ Preview saved!\n\n📂 **Step 3: Select Category**`, Markup.inlineKeyboard(buttons));
      }
      if (!session.preview) session.preview = text;
      else session.preview += '\n\n' + text;
      const wordCount = session.preview.split(' ').length;
      return ctx.reply(`📄 Updated! (${wordCount} words) Type /done when finished.`);
    }

    if (session.step === 'file') {
      return ctx.reply("📤 Please send the book file (PDF, photo, video, etc.) to complete.");
    }

    // ---- REMOVE BOOK FLOW ----
    if (session.step === 'remove_waiting') {
      const bookId = text.trim();
      const book = await getBook(bookId);
      if (!book) {
        return ctx.reply(`❌ Book with ID \`${bookId}\` not found.`, { parse_mode: 'Markdown' });
      }
      session.remove_book_id = bookId;
      session.step = 'remove_confirm';
      return ctx.reply(
        `📖 **Found:**\n\nTitle: ${book.title}\nCategory: ${book.category}\nID: ${book.id}\n\n❓ Are you sure you want to delete this book?\nType **yes** to confirm or **no** to cancel.`
      );
    }

    if (session.step === 'remove_confirm') {
      if (text.toLowerCase() === 'yes') {
        const bookId = session.remove_book_id;
        const result = await removeBook(bookId);
        if (result) {
          delete addBookSessions[userId];
          return ctx.reply(`✅ Book \`${bookId}\` has been removed.`);
        } else {
          return ctx.reply(`❌ Failed to remove book. Please try again.`);
        }
      } else {
        delete addBookSessions[userId];
        return ctx.reply("❌ Removal cancelled.");
      }
    }

    // ---- ORDER BOOK FLOW ----
    if (session.step === 'order_waiting') {
      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        const category = parts[0];
        if (!category) return ctx.reply("❌ Please enter: `category id1 id2 id3 ...`");
        const books = await getBooks(category);
        if (!books || books.length === 0) return ctx.reply(`❌ Category \`${category}\` has no books.`);
        let msg = `📚 **Current order for ${category}:**\n\n`;
        books.forEach((b, i) => {
          msg += `${i+1}. ${b.title} (ID: ${b.id})\n`;
        });
        return ctx.reply(msg, { parse_mode: 'Markdown' });
      }
      const category = parts[0];
      const orderedIds = parts.slice(1);
      const books = await getBooks(category);
      if (!books || books.length === 0) return ctx.reply(`❌ Category \`${category}\` not found or empty.`);
      const allIds = books.map(b => b.id);
      const missing = orderedIds.filter(id => !allIds.includes(id));
      if (missing.length > 0) {
        return ctx.reply(`❌ These IDs are not in category \`${category}\`: ${missing.join(', ')}`);
      }
      if (orderedIds.length !== books.length) {
        return ctx.reply(`⚠️ You provided ${orderedIds.length} IDs, but category has ${books.length} books. Please include all books.`);
      }
      const success = await reorderBooks(category, orderedIds);
      if (success) {
        delete addBookSessions[userId];
        return ctx.reply(`✅ Books in \`${category}\` have been reordered.`);
      } else {
        return ctx.reply(`❌ Failed to reorder. Please try again.`);
      }
    }

    delete addBookSessions[userId];
    return ctx.reply("❌ Session corrupted. Please start again.");
  }

  // ---- SKIP COMMANDS & BUTTON TEXTS ----
  if (text.startsWith('/')) return;
  if (['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ', '📞 አግኙኝ', '💬 አስተያየት', '📊 ስታቲስቲክስ', '🔄 ዳግም ጀምር'].includes(text)) return;

  // ---- SEARCH ----
  const query = text.trim().toLowerCase();
  let matches = [];
  for (const cat of allCategories) {
    const books = await getBooks(cat);
    if (books) {
      for (const book of books) {
        if (book.title.toLowerCase().includes(query)) {
          matches.push({ ...book, catKey: cat });
        }
      }
    }
  }

  if (matches.length === 0) return ctx.reply(`🔍 No results for "${text}"`);
  const buttons = matches.slice(0, 20).map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.catKey}_${book.id}`)
  ]);
  ctx.reply(`🔍 ${matches.length} results:`, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 11. ADD CATEGORY BUTTON (for addbook flow)
// ==========================================
bot.action(/^addcat_(.+)$/, (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const category = ctx.match[1];
  if (!isAdmin(userId)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  if (!addBookSessions[userId]) return ctx.answerCbQuery("⚠️ /addbook first!", { show_alert: true });
  const session = addBookSessions[userId];
  session.category = category;
  session.step = 'file';
  ctx.editMessageText(
    `✅ Category: \`${category}\`\n\n📎 **Step 4: Send the Book File**\n\n📤 Please send the book file (PDF, photo, video, etc.) to complete.\n\n💡 This is the final step!`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('cancel_add_book', (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.editMessageText("❌ መጽሐፍ መጨመር ተሰርዟል።");
  } else {
    ctx.answerCbQuery("❌ ምንም እየተጨመረ ያለ መጽሐፍ የለም");
  }
});

// ==========================================
// 12. SUB-MENU ACTIONS
// ==========================================
bot.action("lang_geez", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez";
    if (!supabase) saveLocalDatabase();
  }
  ctx.editMessageText(
    "በግዕዝ ምድብ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_geez_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_geez_hist")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_geez_bible")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
});

bot.action("sub_geez_hist", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከታሪክና ድርሳናት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_geez_hist")],
      [Markup.button.callback("ገድል ተአምር ድርሳን", "cat_geez_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_geez")]
    ])
  );
});

bot.action("sub_geez_bible", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_geez_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_geez_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_geez")]
    ])
  );
});

bot.action("lang_ga", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez_amharic";
    if (!supabase) saveLocalDatabase();
  }
  ctx.editMessageText(
    "በግዕዝ አማርኛ ምድብ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_ga_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_ga_hist")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_ga_bible")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
});

bot.action("sub_ga_hist", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከታሪክና ድርሳናት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_ga_hist")],
      [Markup.button.callback("ገድል ተአምር ድርሳን", "cat_ga_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
});

bot.action("sub_ga_bible", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_ga_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_ga_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
});

bot.action("lang_amh", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "amharic";
    if (!supabase) saveLocalDatabase();
  }
  ctx.editMessageText(
    "በአማርኛ ምድብ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_amh_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_amh_hist")],
      [Markup.button.callback("ክርስቲያናዊ ሥነ ምግባር", "cat_amh_eth")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ጥናት", "sub_amh_bible")],
      [Markup.button.callback("ነገረ ሃይማኖት", "sub_amh_theology")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
});

bot.action("sub_amh_hist", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከታሪክና ድርሳናት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_amh_hist")],
      [Markup.button.callback("ድርሳን ተአምር ገድላት", "cat_amh_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
});

bot.action("sub_amh_bible", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_amh_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_amh_nt")],
      [Markup.button.callback("መጽሐፍ ቅዱስ ጥናት", "cat_amh_std")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
});

bot.action("sub_amh_theology", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "ከነገረ ሃይማኖት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ነገረ ክርስቶስ", "cat_amh_chr")],
      [Markup.button.callback("ነገረ ማርያም", "cat_amh_mry")],
      [Markup.button.callback("ነገረ ቅዱሳን", "cat_amh_snt")],
      [Markup.button.callback("ነገረ ሃይማኖት", "cat_amh_thl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
});

bot.action("lang_eng", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "english";
    if (!supabase) saveLocalDatabase();
  }
  ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Law & Order", "cat_eng_law")],
      [Markup.button.callback("History & Discourse", "sub_eng_hist")],
      [Markup.button.callback("Christian Ethics", "cat_eng_eth")],
      [Markup.button.callback("Bible Study", "sub_eng_bible")],
      [Markup.button.callback("Theology & Dogma", "sub_eng_theology")],
      [Markup.button.callback("⬅️ Back", "back_to_lang")]
    ])
  );
});

bot.action("sub_eng_hist", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("History", "cat_eng_hist")],
      [Markup.button.callback("Discourse & Miracles", "cat_eng_gdsl")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
});

bot.action("sub_eng_bible", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Old Testament", "cat_eng_ot")],
      [Markup.button.callback("New Testament", "cat_eng_nt")],
      [Markup.button.callback("General Bible Study", "cat_eng_std")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
});

bot.action("sub_eng_theology", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Christology", "cat_eng_chr")],
      [Markup.button.callback("Mariology", "cat_eng_mry")],
      [Markup.button.callback("Hagiography", "cat_eng_snt")],
      [Markup.button.callback("Theology", "cat_eng_thl")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
});

bot.action("back_to_lang", (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  ctx.editMessageText(
    "እባኮን ቋንቋ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
      [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
      [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("In English", "lang_eng")]
    ])
  );
});

// ==========================================
// 13. ADMIN ACTIONS (Approve/Reject)
// ==========================================
bot.action(/^approve_(\d+)_(.+)$/, (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  markUserPaid(userId);
  ctx.telegram.sendMessage(userId, `✅ Payment #${orderNumber} approved! 🎉\n\nAll books are now available! 📚`);
  ctx.editMessageText(`✅ #${orderNumber} approved`);
});

bot.action(/^reject_(\d+)_(.+)$/, (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  ctx.telegram.sendMessage(userId, `❌ Payment #${orderNumber} rejected. Please send a valid receipt.`);
  ctx.editMessageText(`❌ #${orderNumber} rejected`);
});

// ==========================================
// 14. FILE HANDLER
// ==========================================
function extractFileInfo(msg) {
  if (msg.document) {
    return { type: 'document', fileId: msg.document.file_id, fileName: msg.document.file_name || 'Document.pdf' };
  }
  if (msg.photo && msg.photo.length > 0) {
    const photo = msg.photo[msg.photo.length - 1];
    return { type: 'photo', fileId: photo.file_id, fileName: 'Photo.jpg' };
  }
  if (msg.video) {
    return { type: 'video', fileId: msg.video.file_id, fileName: msg.video.file_name || 'Video.mp4' };
  }
  if (msg.audio) {
    return { type: 'audio', fileId: msg.audio.file_id, fileName: msg.audio.file_name || 'Audio.mp3' };
  }
  if (msg.voice) {
    return { type: 'voice', fileId: msg.voice.file_id, fileName: 'Voice.ogg' };
  }
  return null;
}

bot.on(['document', 'photo', 'video', 'audio', 'voice'], async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");

  // ---- ADD BOOK: step === 'file' ----
  if (addBookSessions[userId] && addBookSessions[userId].step === 'file') {
    const session = addBookSessions[userId];
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return ctx.reply("❌ የፋይሉ መረጃ አልተገኘም።");
    const category = session.category;
    const books = await getBooks(category);
    const maxId = books.reduce((max, b) => {
      const num = parseInt(b.id.split('_').pop());
      return num > max ? num : max;
    }, 0);
    const newId = `${category}_${maxId + 1}`;
    const newBook = {
      id: newId,
      category: category,
      file_id: fileInfo.fileId,
      title: session.title,
      preview: session.preview || 'Preview not available'
    };
    const result = await addBook(newBook);
    if (result) {
      delete addBookSessions[userId];
      ctx.reply(
        `✅ **Book Added!** 📚\n\n📂 ${category}\n🆔 ID: ${newId}\n📄 ${session.title}\n📊 Total: ${(await getBooks(category)).length} books`,
        { parse_mode: 'Markdown' }
      );
      logActivity(userId, 'add_book', { category, bookId: newId, title: session.title });
    } else {
      ctx.reply("❌ Failed to add book. Please try again.");
    }
    return;
  }

  // ---- ADMIN: get file ID ----
  if (isAdmin(userId)) {
    const fileInfo = extractFileInfo(message);
    if (fileInfo) {
      return ctx.reply(
        `🔑 **File ID**\n\n📄 ${fileInfo.fileName}\n🆔 \`${fileInfo.fileId}\`\n📁 ${fileInfo.type}`,
        { parse_mode: 'Markdown' }
      );
    }
    return ctx.reply("⚠️ የፋይሉ መረጃ አልተገኘም።");
  }

  // ---- PAID USER ----
  if (isPaidUser(userId)) {
    return ctx.reply("✅ ክፍያ ፈጽመዋል። ፋይልዎ ተቀብለናል።");
  }

  // ---- NON-PAID: RECEIPT ----
  const fileInfo = extractFileInfo(message);
  if (!fileInfo) {
    return ctx.reply("⚠️ ትክክለኛ ሪሲት ይላኩ።");
  }

  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  try {
    const forwardedMsg = await ctx.telegram.forwardMessage(ADMIN_IDS[0], ctx.chat.id, message.message_id);
    if (!supabase) {
      db.pendingReceipts[forwardedMsg.message_id] = { userId, orderNumber, confidence: 100 };
      saveLocalDatabase();
    }
    for (const adminId of ADMIN_IDS) {
      await ctx.telegram.sendMessage(adminId,
        `📥 **New Receipt**\n\n🧾 ${orderNumber}\n👤 ${userId}\n📁 ${fileInfo.fileName}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Approve", `approve_${userId}_${orderNumber}`)],
            [Markup.button.callback("❌ Reject", `reject_${userId}_${orderNumber}`)]
          ])
        }
      );
    }
    ctx.reply(`✅ Receipt received! 🧾 ${orderNumber}\n\nAdmin will review it shortly.`);
  } catch (error) {
    console.error('Forward failed:', error);
    ctx.reply("⚠️ Error processing receipt. Please try again or contact admin.");
  }
});

// ==========================================
// 15. SEARCH (button handler)
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  ctx.reply("🔍 እባክዎን የመጽሐፍ ስም ያስገቡ፦");
});

// ==========================================
// 16. LAUNCH
// ==========================================
async function launchBot() {
  try {
    await bot.launch({ dropPendingUpdates: true });
    console.log("✅ Bot is running...");
    console.log("📚 Orthodox Spiritual Books Bot is ready!");
    console.log("👑 Admin IDs:", ADMIN_IDS);
    let total = 0;
    for (const cat of allCategories) {
      const books = await getBooks(cat);
      total += books ? books.length : 0;
    }
    console.log(`📖 Total Books: ${total}`);
  } catch (error) {
    if (error.message && error.message.includes('409: Conflict')) {
      console.log('⚠️ Conflict detected - another instance is running. Retrying in 5 seconds...');
      setTimeout(launchBot, 5000);
    } else {
      console.error('❌ Failed to launch:', error);
      logError('launch_failed', error);
    }
  }
}

launchBot();

process.once('SIGINT', () => { bot.stop('SIGINT'); });
process.once('SIGTERM', () => { bot.stop('SIGTERM'); });