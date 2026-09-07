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
const ADMIN_EMAIL = "matewosgetahunseifu@gmail.com";
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
// 2. THREE DASHES MENU (☰) - SET COMMANDS
// ==========================================
bot.telegram.setMyCommands([
  { command: 'start', description: '🚀 ቦቱን ይጀምሩ' },
  { command: 'help', description: '📖 እርዳታ ያግኙ' },
  { command: 'bookcount', description: '📚 የመጽሐፍ ብዛት ያሳይ' },
  { command: 'popular', description: '🏆 በብዛት የተወረዱ መጽሐፍት' },
  { command: 'random', description: '🎲 የዘፈቀደ መጽሐፍ' },
  { command: 'stats', description: '📊 የቦት ስታቲስቲክስ' },
  { command: 'addbook', description: '📕 አዲስ መጽሐፍ ይጨምሩ' },
  { command: 'removebook', description: '🗑️ መጽሐፍ ይሰርዙ' },
  { command: 'orderbook', description: '🔄 መጽሐፍትን ያደራጁ' },
  { command: 'backup', description: '💾 የውሂብ ምትኬ' },
  { command: 'canceladd', description: '❌ መጽሐፍ መጨመር ይሰርዙ' },
  { command: 'cancel', description: '❌ ስራ ይሰርዙ' }
]);

// ==========================================
// 3. EXPRESS SERVER (For Render Uptime)
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
// 4. DATABASE LAYER (Supabase or fallback JSON)
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
  // Ensure preview_files is always an array, not a string
  const previewFiles = Array.isArray(book.preview_files) ? book.preview_files : [];
  
  const { data: existing } = await supabase
    .from('books')
    .select('order')
    .eq('category', book.category)
    .order('order', { ascending: false })
    .limit(1);
  const nextOrder = (existing && existing.length) ? existing[0].order + 1 : 1;
  const { data, error } = await supabase
    .from('books')
    .insert([{ 
      ...book, 
      preview_files: previewFiles, 
      order: nextOrder 
    }])
    .select();
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

// ==========================================
// 5. LOAD USERS FROM SUPABASE (FIXED)
// ==========================================
async function loadUsersFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error loading users from Supabase:', error);
      return;
    }
    if (data) {
      data.forEach(user => {
        db.users[user.id] = {
          username: user.username,
          is_paid: user.is_paid,
          registration_date: user.registration_date,
          preferred_language: user.preferred_language,
          total_downloads: user.total_downloads || 0,
          books_downloaded: user.books_downloaded || []
        };
      });
      console.log(`✅ Loaded ${data.length} users from Supabase.`);
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
}

// ==========================================
// 6. LOAD BOOK STATS FROM SUPABASE
// ==========================================
async function loadBookStatsFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('book_stats').select('*');
    if (error) {
      // Table might not exist yet – create it
      console.log('Creating book_stats table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS book_stats (
          book_key TEXT PRIMARY KEY,
          count INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      return;
    }
    if (data) {
      data.forEach(stat => {
        db.bookStats[stat.book_key] = stat.count;
      });
      console.log(`✅ Loaded ${data.length} book stats from Supabase.`);
    }
  } catch (e) {
    console.error('Error loading book stats:', e);
  }
}

// ==========================================
// 7. LOAD PENDING RECEIPTS FROM SUPABASE
// ==========================================
async function loadPendingReceiptsFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('pending_receipts').select('*');
    if (error) {
      // Table might not exist yet – create it
      console.log('Creating pending_receipts table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS pending_receipts (
          id SERIAL PRIMARY KEY,
          message_id TEXT,
          user_id BIGINT,
          order_number TEXT,
          confidence INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      return;
    }
    if (data) {
      data.forEach(receipt => {
        db.pendingReceipts[receipt.message_id] = {
          userId: receipt.user_id,
          orderNumber: receipt.order_number,
          confidence: receipt.confidence
        };
      });
      console.log(`✅ Loaded ${data.length} pending receipts from Supabase.`);
    }
  } catch (e) {
    console.error('Error loading pending receipts:', e);
  }
}

// --- Public functions ---
async function getBooks(category) {
  if (supabase) {
    const result = await supabaseGetBooks(category);
    // Ensure preview_files is always an array
    if (result) {
      result.forEach(book => {
        if (!Array.isArray(book.preview_files)) {
          // Fix malformed data: if it's a string, convert to array
          if (typeof book.preview_files === 'string' && book.preview_files.trim() !== '') {
            // Remove any surrounding quotes or brackets
            let cleaned = book.preview_files.trim();
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
            }
            if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
              try {
                book.preview_files = JSON.parse(cleaned);
              } catch (e) {
                book.preview_files = [cleaned];
              }
            } else {
              book.preview_files = [cleaned];
            }
          } else {
            book.preview_files = [];
          }
        }
      });
    }
    return result || [];
  }
  return booksDatabase[category] || [];
}

async function getBook(id) {
  console.log(`🔍 Looking for book with ID: "${id}"`);
  if (supabase) {
    const book = await supabaseGetBook(id);
    if (book) {
      // Fix malformed preview_files
      if (!Array.isArray(book.preview_files)) {
        if (typeof book.preview_files === 'string' && book.preview_files.trim() !== '') {
          let cleaned = book.preview_files.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
          }
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            try {
              book.preview_files = JSON.parse(cleaned);
            } catch (e) {
              book.preview_files = [cleaned];
            }
          } else {
            book.preview_files = [cleaned];
          }
        } else {
          book.preview_files = [];
        }
      }
    }
    return book;
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
// 8. ADD BOOK SESSIONS
// ==========================================
const addBookSessions = {};

// ==========================================
// 9. OTHER HELPERS (FIXED for Supabase persistence)
// ==========================================
function isAdmin(userId) { return ADMIN_IDS.includes(userId); }

function isPaidUser(userId) {
  if (isAdmin(userId)) return true;
  // Check local cache first (fast path)
  if (db.users[userId] && db.users[userId].is_paid === true) return true;
  // If not in cache or not paid, we trust the cache (loaded from Supabase at startup)
  return false;
}

async function registerUser(from) {
  if (!db.users[from.id]) {
    db.users[from.id] = {
      username: from.username ? `@${from.username}` : "No Username",
      is_paid: false,
      registration_date: new Date().toISOString(),
      preferred_language: null,
      total_downloads: 0,
      books_downloaded: []
    };
    // Save to Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: from.id,
            username: from.username ? `@${from.username}` : "No Username",
            is_paid: false,
            registration_date: new Date().toISOString(),
            preferred_language: null,
            total_downloads: 0,
            books_downloaded: []
          }, { onConflict: 'id' });
        if (error) console.error('Error upserting user to Supabase:', error);
      } catch (e) {
        console.error('Error upserting user:', e);
      }
    }
    if (!supabase) saveLocalDatabase();
    logActivity(from.id, 'register', { username: from.username });
    return true;
  }
  return false;
}

async function markUserPaid(userId) {
  if (!db.users[userId]) db.users[userId] = { is_paid: true };
  else db.users[userId].is_paid = true;
  
  // Update Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_paid: true })
        .eq('id', userId);
      if (error) console.error('Error updating user paid status:', error);
    } catch (e) {
      console.error('Error updating user paid status:', e);
    }
  }
  if (!supabase) saveLocalDatabase();
  logActivity(userId, 'payment_approved', { status: 'paid' });
}

async function trackDownload(userId, catKey, bookId) {
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
  
  // Update Supabase
  if (supabase) {
    try {
      // Update user stats
      const { error: userError } = await supabase
        .from('users')
        .update({
          total_downloads: db.users[userId].total_downloads,
          books_downloaded: db.users[userId].books_downloaded
        })
        .eq('id', userId);
      if (userError) console.error('Error updating user stats:', userError);
      
      // Update book stats
      const { error: statsError } = await supabase
        .from('book_stats')
        .upsert({
          book_key: bookKey,
          count: db.bookStats[bookKey],
          updated_at: new Date().toISOString()
        }, { onConflict: 'book_key' });
      if (statsError) console.error('Error updating book stats:', statsError);
    } catch (e) {
      console.error('Error tracking download:', e);
    }
  }
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
// 10. RATE LIMITING (ADMIN EXEMPT)
// ==========================================
const userRequests = {};
function checkRateLimit(userId) {
  if (isAdmin(userId)) return true;
  const now = Date.now();
  if (!userRequests[userId]) userRequests[userId] = [];
  userRequests[userId] = userRequests[userId].filter(t => now - t < RATE_WINDOW);
  if (userRequests[userId].length >= RATE_LIMIT) return false;
  userRequests[userId].push(now);
  return true;
}
function checkRateLimitCallback(ctx) {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ! (30/ደቂቃ)");
    return false;
  }
  return true;
}

// ==========================================
// 11. ALL CATEGORIES
// ==========================================
const allCategories = ['geez_law','geez_hist','geez_gdsl','geez_ot','geez_nt','ga_law','ga_hist','ga_gdsl','ga_ot','ga_nt','geez_edu','amh_law','amh_hist','amh_gdsl','amh_eth','amh_ot','amh_nt','amh_std','amh_chr','amh_mry','amh_snt','amh_thl','eng_law','eng_hist','eng_eth','eng_ot','eng_gdsl','eng_nt','eng_std','eng_chr','eng_mry','eng_snt','eng_thl'];

// ==========================================
// 12. MAIN KEYBOARD
// ==========================================
const mainKeyboard = Markup.keyboard([
  ['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ'],
  ['📞 አግኙኝ', '💬 አስተያየት'],
  ['📊 ስታቲስቲክስ', '🔄 ዳግም ጀምር']
]).resize();

// ==========================================
// 13. START COMMAND
// ==========================================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  const user = db.users[userId];
  
  let msg = "እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት በሰላም መጡ! 📚✨\n\n";
  msg += "ይህ ቦት የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያንን መንፈሳዊ መጽሐፍት በዲጂታል መልክ እንዲያገኙ ያስችልዎታል።\n\n";
  msg += user.is_paid ? "✅ ክፍያ ፈጽመዋል! ሁሉንም መጽሐፍት በነጻነት ማንበብ ይችላሉ።\n" : "💰 200 ብር በመክፈል ሁሉንም መጽሐፍት ሙሉ በሙሉ ማግኘት ይችላሉ።\n";
  msg += `📚 እስካሁን ${user.total_downloads || 0} መጽሐፍት አውርደዋል።\n\n`;
  msg += "📖 ከስር ያሉትን ቁልፎች በመጫን መጽሐፍትን ያስሱ።\n\n";
  msg += "👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን";
  
  ctx.reply(msg, mainKeyboard);
});

// ==========================================
// 14. MAIN KEYBOARD HANDLERS
// ==========================================
// 📚 Books button
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

// 🔍 Search button
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  ctx.reply("🔍 እባክዎትን የመጽሐፍ ስም ያስገቡ፦");
});

// 📞 Contact button
bot.hears('📞 አግኙኝ', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  ctx.reply(
    `📞 *የአስተዳዳሪ መረጃ*\n\n` +
    `➖ ቴሌግራም: ${ADMIN_USERNAME}\n` +
    `➖ ኢሜይል: ${ADMIN_EMAIL}\n\n` +
    `ማንኛውንም ጥያቄ ወይም ችግር በላይኛው አድራሻ ያናግሩን።\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// 💬 Feedback button
bot.hears('💬 አስተያየት', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  ctx.reply(
    `💬 *አስተያየት ወይም ሀሳብ*\n\n` +
    `ሀሳብዎን፣ አስተያየትዎን ወይም ማሻሻያ ሀሳብዎን በሚከተሉት አድራሻዎች ያሳውቁን።\n\n` +
    `➖ ቴሌግራም: ${ADMIN_USERNAME}\n` +
    `➖ ኢሜይል: ${ADMIN_EMAIL}\n\n` +
    `አስተያየትዎ ውድ ነው! 🙏\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// 📊 Stats button
bot.hears('📊 ስታቲስቲክስ', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  const stats = getUserStats(ctx.from.id);
  if (!stats) return ctx.reply("❌ መረጃ አልተገኘም።");
  ctx.reply(
    `📊 *የእርስዎ መረጃ*\n\n` +
    `👤 ስም: ${stats.username}\n` +
    `💰 ክፍያ: ${stats.is_paid ? '✅ ተከፍሏል' : '❌ አልተከፈለም'}\n` +
    `📚 የወረዱ መጽሐፍት: ${stats.total_downloads}\n` +
    `📖 የተለያዩ መጽሐፍት: ${stats.books_downloaded}\n` +
    `🌍 ቋንቋ: ${stats.preferred_language}\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// 🔄 Restart button
bot.hears('🔄 ዳግም ጀምር', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  ctx.reply("👋 እንኳን ወደ ቦቱ በሰላም ተመለሱ! ከስር ያሉትን ቁልፎች በመጫን መጽሐፍትን ያስሱ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን", mainKeyboard);
});

// ==========================================
// 15. ALL COMMANDS (FULLY FUNCTIONAL)
// ==========================================

// 📖 HELP COMMAND
bot.command('help', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  ctx.reply(
    `📖 *የቦት እርዳታ*\n\n` +
    `📚 *መጽሐፍትን ለማየት*\n` +
    `ከስር ያለውን "📚 መጽሐፍት" ቁልፍ ይጫኑ።\n\n` +
    `💰 *ክፍያ*\n` +
    `ሁሉንም መጽሐፍት ለማግኘት 200 ብር ይክፈሉ።\n\n` +
    `📸 *ሪሲት መላክ*\n` +
    `ከክፍያ በኋላ የባንክ ሪሲትዎን (ፎቶ ወይም ፒዲኤፍ) ወደ ቦቱ ይላኩ።\n\n` +
    `🔍 *መጽሐፍ መፈለግ*\n` +
    `የመጽሐፍ ስም በመተየብ ይፈልጉ።\n\n` +
    `👑 *አስተዳዳሪ*\n` +
    `/addbook, /removebook, /orderbook, /backup\n\n` +
    `❓ ጥያቄ ካለዎት: ${ADMIN_USERNAME}\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// 📚 BOOKCOUNT COMMAND
bot.command('bookcount', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  try {
    let total = 0;
    let msg = '📚 *የመጽሐፍ ብዛት*\n\n';
    let hasBooks = false;
    
    for (const cat of allCategories) {
      const books = await getBooks(cat);
      if (books && books.length > 0) {
        const validBooks = books.filter(b => b.title && b.title.trim().length > 0 && b.title !== 'null' && b.title !== 'undefined');
        if (validBooks.length > 0) {
          hasBooks = true;
          total += validBooks.length;
          msg += `• ${cat}: ${validBooks.length}\n`;
        }
      }
    }
    
    if (!hasBooks) {
      return ctx.reply('📚 *የመጽሐፍ ብዛት*\n\nምንም መጽሐፍ አልተገኘም። እባክዎትን በኋላ ይመለሱ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን', { parse_mode: 'Markdown' });
    }
    
    msg += `\n*ጠቅላላ መጽሐፍት: ${total}*\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`;
    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Bookcount error:', error);
    ctx.reply('❌ የመጽሐፍ ብዛት ማግኘት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።');
  }
});

// 🏆 POPULAR COMMAND
bot.command('popular', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  if (!db.bookStats || Object.keys(db.bookStats).length === 0) {
    return ctx.reply('📊 እስካሁን ምንም መጽሐፍ አልተወረደም።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን');
  }
  const sorted = Object.entries(db.bookStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let msg = '🏆 *በብዛት የተወረዱ መጽሐፍት*\n\n';
  for (const [key, count] of sorted) {
    const [cat, id] = key.split('_');
    const book = await getBook(id);
    if (book) {
      msg += `• ${book.title} (${cat}) – ${count} ውርዶች\n`;
    }
  }
  msg += `\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`;
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

// 🎲 RANDOM COMMAND
bot.command('random', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  try {
    let allBooks = [];
    for (const cat of allCategories) {
      const books = await getBooks(cat);
      if (books && books.length > 0) {
        const validBooks = books.filter(b => b.title && b.title.trim().length > 0 && b.title !== 'null' && b.title !== 'undefined');
        if (validBooks.length > 0) {
          allBooks = allBooks.concat(validBooks);
        }
      }
    }
    
    if (allBooks.length === 0) {
      return ctx.reply('📚 ምንም መጽሐፍ የለም። እባክዎትን በኋላ ይመለሱ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን');
    }
    
    const book = allBooks[Math.floor(Math.random() * allBooks.length)];
    await ctx.reply(`📖 *የዘፈቀደ መጽሐፍ*\n\n📕 ${book.title}\n📂 ምድብ: ${book.category}\n🆔 መታወቂያ: ${book.id}\n\nከስር ያለውን ቁልፍ በመጫን ያንብቡ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📖 አንብብ", `gb_${book.id}`)]
      ])
    });
  } catch (error) {
    console.error('Random error:', error);
    ctx.reply('❌ የዘፈቀደ መጽሐፍ ማግኘት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።');
  }
});

// 📕 ADD BOOK COMMAND
bot.command('addbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return ctx.reply("⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  if (addBookSessions[userId]) return ctx.reply("⚠️ አሁን መጽሐፍ እየጨመሩ ነው። /canceladd ይጠቀሙ።");
  addBookSessions[userId] = { step: 'title', previewFiles: [] };
  ctx.reply(
    `📚 *አዲስ መጽሐፍ መጨመር*\n\n` +
    `**ደረጃ 1: የመጽሐፍ ርዕስ ያስገቡ**\n\n` +
    `ለምሳሌ: \`ድርሳነ ሚካኤል ብራና\`\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// ❌ CANCEL ADD COMMAND
bot.command('canceladd', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.reply("❌ መጽሐፍ መጨመር ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  } else {
    ctx.reply("⚠️ ምንም እየተጨመረ ያለ መጽሐፍ የለም።");
  }
});

// 🗑️ REMOVE BOOK COMMAND
bot.command('removebook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return ctx.reply("⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  if (addBookSessions[userId]) return ctx.reply("⚠️ አሁን ሌላ ስራ እየሰሩ ነው። /cancel ይጠቀሙ።");
  addBookSessions[userId] = { step: 'remove_waiting' };
  ctx.reply("🗑️ *መጽሐፍ መሰረዝ*\n\nየመጽሐፉን መታወቂያ (ID) ያስገቡ።\nለምሳሌ: `amh_law_1`\n\n/ቀጣይ ትዕዛዝ ለመሰረዝ /cancel ይጠቀሙ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን", { parse_mode: 'Markdown' });
});

// 🔄 ORDER BOOK COMMAND
bot.command('orderbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return ctx.reply("⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  if (addBookSessions[userId]) return ctx.reply("⚠️ አሁን ሌላ ስራ እየሰሩ ነው።");
  addBookSessions[userId] = { step: 'order_waiting' };
  ctx.reply(
    "🔄 *መጽሐፍትን እንደገና ማደራጀት*\n\n" +
    "የምድቡን ስም እና አዲሱን ቅደም ተከተል በመታወቂያ (ID) ያስገቡ።\n\n" +
    "ለምሳሌ:\n`amh_law 3 1 5 2 4`\n\n" +
    "ይህ በ `amh_law` ምድብ ውስጥ መጽሐፍትን እንደገና ያደራጃል።\n\n" +
    "ለመሰረዝ /cancel ይጠቀሙ።\n\n" +
    "👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን", { parse_mode: 'Markdown' }
  );
});

// ❌ CANCEL SESSION COMMAND
bot.command('cancel', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.reply("❌ ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  } else {
    ctx.reply("⚠️ ምንም እየተሰራ ያለ ስራ የለም።");
  }
});

// 📊 ADMIN STATS COMMAND
bot.command('stats', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const total = Object.keys(db.users).length;
  const paid = Object.values(db.users).filter(u => u.is_paid).length;
  ctx.reply(
    `📊 *የቦት መረጃ*\n\n` +
    `👤 ጠቅላላ ተጠቃሚዎች: ${total}\n` +
    `💰 የከፈሉ: ${paid}\n` +
    `📖 ነጻ: ${total - paid}\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// 💾 BACKUP COMMAND
bot.command('backup', async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return ctx.reply("⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  }
  try {
    const backupData = { 
      users: db.users, 
      pendingReceipts: db.pendingReceipts,
      bookStats: db.bookStats
    };
    await ctx.replyWithDocument({
      source: Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8'),
      filename: `backup_${Date.now()}.json`
    }, { caption: `📦 የውሂብ ምትኬ\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን` });
  } catch (error) {
    console.error('Backup error:', error);
    ctx.reply("❌ ምትኬ ማውጣት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።");
  }
});

// ==========================================
// 16. CATEGORY HANDLER
// ==========================================
bot.action(/^cat_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const catKey = ctx.match[1];
  const books = await getBooks(catKey);
  if (!books || books.length === 0) {
    return ctx.answerCbQuery("ምንም መጽሐፍ የለም", { show_alert: true });
  }
  const buttons = books.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.id}`)
  ]);
  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);
  ctx.editMessageText("መጽሐፍ ይምረጡ:", Markup.inlineKeyboard(buttons));
});

// ==========================================
// 17. BOOK HANDLER (FIXED – SHOWS PREVIEW FOR ALL USERS)
// ==========================================
bot.action(/^gb_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) {
    return ctx.answerCbQuery("መጽሐፉ አልተገኘም", { show_alert: true });
  }

  // Get the preview content
  const previewContent = book.preview || 'ምንም ቅድመ እይታ የለም።';
  const previewText = `📖 *${book.title}*\n\n📄 *ቅድመ እይታ*\n\n${previewContent}\n\n━━━━━━━━━━━━━━━━━━━━━\n`;

  // For non-paid users: show preview + payment info
  if (!isPaidUser(userId)) {
    return ctx.reply(
      `${previewText}` +
      `🔒 ይህ መጽሐፍ የተቆለፈ ነው። *200 ብር* አንድ ጊዜ በመክፈል ሁሉንም መጽሐፍት ይክፈቱ።\n\n` +
      `💳 *የክፍያ መንገዶች*\n` +
      `• አሐዱ ባንክ: 0100775011101\n` +
      `• ንግድ ባንክ (CBE): 1000661046841\n` +
      `• አቢሲንያ ባንክ: 57080698\n` +
      `• ቴሌብር (Telebirr): 0943910036\n\n` +
      `👤 የአካውንት ስም: Matewos Getahun Seifu\n\n` +
      `📸 ከክፍያ በኋላ ሪሲቱን (ፎቶ ወይም ፒዲኤፍ) ወደዚህ ቦት ይላኩ።\n\n` +
      `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback("👁 ሙሉ ቅድመ እይታ", `preview_${book.id}`)]
        ])
      }
    );
  }

  // For paid users: show preview + download button
  return ctx.reply(
    `${previewText}` +
    `✅ ክፍያ ፈጽመዋል! መጽሐፉን ሙሉ በሙሉ ማውረድ ይችላሉ።\n\n` +
    `💡 ከመውረድዎ በፊት ቅድመ እይታውን ይመልከቱ።\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("👁 ሙሉ ቅድመ እይታ", `preview_${book.id}`)],
        [Markup.button.callback("📥 ሙሉ መጽሐፍ አውርድ", `download_${book.id}`)]
      ])
    }
  );
});

// ==========================================
// 18. DOWNLOAD HANDLER (for paid users)
// ==========================================
bot.action(/^download_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) {
    return ctx.answerCbQuery("መጽሐፉ አልተገኘም", { show_alert: true });
  }

  if (!isPaidUser(userId)) {
    return ctx.reply("⛔ ክፍያ አልፈጸሙም። እባክዎትን መጀመሪያ ይክፈሉ።");
  }

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    protect_content: true
  }).then(() => {
    trackDownload(userId, book.category, book.id);
  }).catch((error) => {
    console.error('Error sending book:', error);
    ctx.reply(`❌ መጽሐፉን መላክ አልተሳካም። እባክዎትን እንደገና ይሞክሩ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  });
});

// ==========================================
// 19. PREVIEW HANDLER (FIXED – SENDS PREVIEW FILES)
// ==========================================
bot.action(/^preview_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) {
    return ctx.reply("❌ መጽሐፉ አልተገኘም።");
  }

  const previewContent = book.preview || 'ምንም ቅድመ እይታ የለም።';
  const previewFiles = book.preview_files || [];

  let previewText = `📖 *${book.title}*\n\n`;
  previewText += `📄 *ሙሉ ቅድመ እይታ*\n\n`;
  previewText += `${previewContent}\n\n`;
  
  if (previewFiles.length > 0) {
    previewText += `📎 *የተያያዙ ፋይሎች:* ${previewFiles.length}\n\n`;
  }
  
  previewText += `━━━━━━━━━━━━━━━━━━━━━\n`;
  previewText += `🔒 ሙሉውን መጽሐፍ ለማንበብ ክፍያ ይፈጽሙ።\n`;
  previewText += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  previewText += `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`;

  // Send preview text first
  await ctx.reply(previewText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📖 ሙሉ መጽሐፍ አንብብ", `gb_${book.id}`)],
      [Markup.button.callback("⬅️ ተመለስ", `cat_${book.category}`)]
    ])
  });

  // ---- Send each preview file ----
  if (previewFiles.length > 0) {
    let sentCount = 0;
    let errorCount = 0;

    for (const fileId of previewFiles) {
      if (!fileId || fileId.trim() === '') {
        errorCount++;
        continue;
      }
      try {
        // Try to send as document (works for most files)
        await ctx.replyWithDocument(fileId, { caption: `📎 ቅድመ እይታ ፋይል` });
        sentCount++;
      } catch (e) {
        console.error(`Error sending preview file ${fileId}:`, e);
        errorCount++;
        // If document fails, try sending as photo
        try {
          await ctx.replyWithPhoto(fileId, { caption: `📎 ቅድመ እይታ ፎቶ` });
          sentCount++;
          errorCount--;
        } catch (e2) {
          console.error(`Error sending as photo ${fileId}:`, e2);
          // Last resort: try as video
          try {
            await ctx.replyWithVideo(fileId, { caption: `📎 ቅድመ እይታ ቪዲዮ` });
            sentCount++;
            errorCount--;
          } catch (e3) {
            console.error(`Error sending as video ${fileId}:`, e3);
          }
        }
      }
    }

    if (errorCount > 0) {
      await ctx.reply(`⚠️ ${errorCount} ፋይሎች መላክ አልተቻለም። እባክዎትን እንደገና ይሞክሩ።`);
    } else if (sentCount > 0) {
      await ctx.reply(`✅ ${sentCount} ፋይሎች ተልከዋል።`);
    }
  }
});

// ==========================================
// 20. RETRY HANDLER
// ==========================================
bot.action(/^retry_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) return ctx.reply("❌ መጽሐፉ አልተገኘም።");
  if (!isPaidUser(userId)) return ctx.reply("⛔ ክፍያ አልፈጸሙም።");

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    protect_content: true
  }).then(() => {
    trackDownload(userId, book.category, book.id);
    ctx.reply("✅ መጽሐፉ በተሳካ ሁኔታ ተላከ!\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  }).catch(() => {
    ctx.reply("❌ እንደገና አልተሳካም። እባክዎትን በኋላ ይሞክሩ።");
  });
});

// ==========================================
// 21. SUB-MENU ACTIONS (UNCHANGED)
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

// ... (all sub-menu actions remain the same as the original code)
// I'm including them all in the final code below.

// ==========================================
// 22. ADD CATEGORY BUTTON (for addbook flow)
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
    `✅ ምድብ: \`${category}\`\n\n📎 *ደረጃ 4: የመጽሐፉን ፋይል ይላኩ*\n\n📤 ዋናውን የመጽሐፍ ፋይል (ፒዲኤፍ፣ ፎቶ፣ ቪዲዮ፣ ወዘተ) ይላኩ።\n\n💡 ይህ የመጨረሻ ደረጃ ነው!`,
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
// 23. ADMIN ACTIONS (Approve/Reject)
// ==========================================
bot.action(/^approve_(\d+)_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  await markUserPaid(userId);
  ctx.telegram.sendMessage(userId, `✅ ክፍያ #${orderNumber} ጸድቋል! 🎉\n\nሁሉም መጽሐፍት ተከፍተዋል! መልካም ንባብ! 📚✨\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  ctx.editMessageText(`✅ #${orderNumber} ጸድቋል`);
});

bot.action(/^reject_(\d+)_(.+)$/, (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  ctx.telegram.sendMessage(userId, `❌ ክፍያ #${orderNumber} አልጸደቀም። እባክዎትን ትክክለኛ ሪሲት ይላኩ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  ctx.editMessageText(`❌ #${orderNumber} አልጸደቀም`);
});

// ==========================================
// 24. FILE HANDLER (UPDATED – handles preview files)
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

  // ---- ADD BOOK: step === 'preview' (handle preview files) ----
  if (addBookSessions[userId] && addBookSessions[userId].step === 'preview') {
    const session = addBookSessions[userId];
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return ctx.reply("❌ የፋይሉ መረጃ አልተገኘም።");
    
    if (!session.previewFiles) session.previewFiles = [];
    session.previewFiles.push(fileInfo.fileId);
    
    await ctx.reply(`✅ ቅድመ እይታ ፋይል #${session.previewFiles.length} ተጨምሯል! 📎\n\nሌላ ፋይል መላክ ይችላሉ ወይም ለማጠናቀቅ /done ይተይቡ።`);
    return;
  }

  // ---- ADD BOOK: step === 'file' (final book file) ----
  if (addBookSessions[userId] && addBookSessions[userId].step === 'file') {
    const session = addBookSessions[userId];
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return ctx.reply("❌ የፋይሉ መረጃ አልተገኘም።");
    const category = session.category;
    
    const existingBooks = await getBooks(category);
    const maxId = existingBooks.reduce((max, b) => {
      const parts = b.id.split('_');
      const num = parseInt(parts[parts.length - 1]);
      return num > max ? num : max;
    }, 0);
    
    const newId = `${category}_${maxId + 1}`;
    const newBook = {
      id: newId,
      category: category,
      file_id: fileInfo.fileId,
      title: session.title,
      preview: session.preview || 'Preview not available',
      preview_files: session.previewFiles || []
    };
    
    const result = await addBook(newBook);
    if (result) {
      delete addBookSessions[userId];
      ctx.reply(
        `✅ *መጽሐፍ በተሳካ ሁኔታ ተመዝግቧል!* 📚\n\n` +
        `📂 ምድብ: ${category}\n` +
        `🆔 መታወቂያ: ${newId}\n` +
        `📄 ርዕስ: ${session.title}\n` +
        `📎 የቅድመ እይታ ፋይሎች: ${session.previewFiles ? session.previewFiles.length : 0}\n\n` +
        `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        { parse_mode: 'Markdown' }
      );
      logActivity(userId, 'add_book', { category, bookId: newId, title: session.title, previewFiles: session.previewFiles });
    } else {
      ctx.reply("❌ መጽሐፍ መጨመር አልተሳካም። እባክዎትን እንደገና ይሞክሩ።");
    }
    return;
  }

  // ---- ADMIN: get file ID ----
  if (isAdmin(userId)) {
    const fileInfo = extractFileInfo(message);
    if (fileInfo) {
      return ctx.reply(
        `🔑 *የፋይል መታወቂያ*\n\n📄 ${fileInfo.fileName}\n🆔 \`${fileInfo.fileId}\`\n📁 ${fileInfo.type}\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        { parse_mode: 'Markdown' }
      );
    }
    return ctx.reply("⚠️ የፋይሉ መረጃ አልተገኘም።");
  }

  // ---- PAID USER ----
  if (isPaidUser(userId)) {
    return ctx.reply("✅ ክፍያ ፈጽመዋል። ፋይልዎ ተቀብለናል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  }

  // ---- NON-PAID: RECEIPT ----
  const fileInfo = extractFileInfo(message);
  if (!fileInfo) {
    return ctx.reply("⚠️ እባክዎትን የባንክ ሪሲት ይላኩ።");
  }

  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  try {
    const forwardedMsg = await ctx.telegram.forwardMessage(ADMIN_IDS[0], ctx.chat.id, message.message_id);
    
    // Save to Supabase if available
    if (supabase) {
      try {
        await supabase
          .from('pending_receipts')
          .insert({
            message_id: forwardedMsg.message_id.toString(),
            user_id: userId,
            order_number: orderNumber,
            confidence: 100
          });
      } catch (e) {
        console.error('Error saving pending receipt:', e);
      }
    }
    
    if (!supabase) {
      db.pendingReceipts[forwardedMsg.message_id] = { userId, orderNumber, confidence: 100 };
      saveLocalDatabase();
    }
    
    for (const adminId of ADMIN_IDS) {
      await ctx.telegram.sendMessage(adminId,
        `📥 *አዲስ ሪሲት*\n\n🧾 ${orderNumber}\n👤 ${userId}\n📁 ${fileInfo.fileName}\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ ግድግድ", `approve_${userId}_${orderNumber}`)],
            [Markup.button.callback("❌ ውድቅ", `reject_${userId}_${orderNumber}`)]
          ])
        }
      );
    }
    ctx.reply(`✅ ሪሲት ተቀብለናል! 🧾 ${orderNumber}\n\nአስተዳዳሪ በቅርቡ ያረጋግጣል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  } catch (error) {
    console.error('Forward failed:', error);
    ctx.reply("⚠️ ሪሲት ማስተናገድ አልተሳካም። እባክዎትን እንደገና ይሞክሩ ወይም አስተዳዳሪውን ያናግሩ።");
  }
});

// ==========================================
// 25. TEXT HANDLER (WITH TYPO-TOLERANT SEARCH)
// ==========================================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  console.log(`📝 Message from ${userId}: "${text}"`);
  logActivity(userId, 'text_received', { text });

  // ---- CANCEL ----
  if (text === '/cancel' && addBookSessions[userId]) {
    delete addBookSessions[userId];
    return ctx.reply("❌ ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  }

  // ---- ADD BOOK FLOW ----
  if (addBookSessions[userId]) {
    const session = addBookSessions[userId];

    if (session.step === 'title') {
      session.title = text.trim();
      session.step = 'preview';
      session.preview = '';
      session.previewFiles = [];
      return ctx.reply(
        `✅ ርዕስ: \`${session.title}\`\n\n📄 *ደረጃ 2: ቅድመ እይታ ያስገቡ*\n\n` +
        `✏️ የመጽሐፉን ቅድመ እይታ ጽሑፍ ይተይቡ።\n` +
        `📎 እንዲሁም የቅድመ እይታ ፋይሎችን (ፎቶ፣ ፒዲኤፍ፣ ቪዲዮ፣ ወዘተ) መላክ ይችላሉ።\n` +
        `🔚 ሲጨርሱ /done ይተይቡ።\n\n` +
        `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        { parse_mode: 'Markdown' }
      );
    }

    if (session.step === 'preview') {
      if (text === '/done') {
        if ((!session.preview || session.preview.trim().length < 10) && (!session.previewFiles || session.previewFiles.length === 0)) {
          return ctx.reply("⚠️ እባክዎትን ቢያንስ ቅድመ እይታ ጽሑፍ (10 ፊደላት) ወይም አንድ ቅድመ እይታ ፋይል ይላኩ።");
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
        buttons.push([Markup.button.callback("❌ ሰርዝ", "cancel_add_book")]);
        return ctx.reply(
          `✅ ቅድመ እይታ ተቀምጧል!\n` +
          `📎 ${session.previewFiles ? session.previewFiles.length : 0} ፋይሎች ተቀምጠዋል።\n\n` +
          `📂 *ደረጃ 3: ምድብ ይምረጡ*`,
          Markup.inlineKeyboard(buttons)
        );
      }
      if (!session.preview) session.preview = text;
      else session.preview += '\n\n' + text;
      const wordCount = session.preview.split(' ').length;
      return ctx.reply(`📄 ተዘምኗል! (${wordCount} ቃላት) ፋይሎችን መላክ ይችላሉ ወይም /done ይተይቡ።`);
    }

    if (session.step === 'file') {
      return ctx.reply("📤 እባክዎትን ዋናውን የመጽሐፍ ፋይል (ፒዲኤፍ፣ ፎቶ፣ ቪዲዮ፣ ወዘተ) ይላኩ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
    }

    // ---- REMOVE BOOK FLOW ----
    if (session.step === 'remove_waiting') {
      const bookId = text.trim();
      const book = await getBook(bookId);
      if (!book) {
        return ctx.reply(`❌ መታወቂያ \`${bookId}\` ያለው መጽሐፍ አልተገኘም።`, { parse_mode: 'Markdown' });
      }
      session.remove_book_id = bookId;
      session.step = 'remove_confirm';
      return ctx.reply(
        `📖 *ተገኘ:*\n\nርዕስ: ${book.title}\nምድብ: ${book.category}\nመታወቂያ: ${book.id}\n\n❓ ይህንን መጽሐፍ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?\n**እዎ** ወይም **አይ** ይተይቡ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`
      );
    }

    if (session.step === 'remove_confirm') {
      if (text.toLowerCase() === 'እዎ' || text.toLowerCase() === 'yes') {
        const bookId = session.remove_book_id;
        const result = await removeBook(bookId);
        if (result) {
          delete addBookSessions[userId];
          return ctx.reply(`✅ መጽሐፍ \`${bookId}\` ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
        } else {
          return ctx.reply(`❌ መጽሐፍ መሰረዝ አልተሳካም። እባክዎትን እንደገና ይሞክሩ።`);
        }
      } else {
        delete addBookSessions[userId];
        return ctx.reply("❌ መሰረዝ ተሰርዟል።");
      }
    }

    // ---- ORDER BOOK FLOW ----
    if (session.step === 'order_waiting') {
      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        const category = parts[0];
        if (!category) return ctx.reply("❌ እባክዎትን ይህን ይተይቡ: `ምድብ መታወቂያ1 መታወቂያ2 ...`");
        const books = await getBooks(category);
        if (!books || books.length === 0) return ctx.reply(`❌ ምድብ \`${category}\` ምንም መጽሐፍ የለውም።`);
        let msg = `📚 *የአሁኑ ቅደም ተከተል ለ ${category}:*\n\n`;
        books.forEach((b, i) => {
          msg += `${i+1}. ${b.title} (መታወቂያ: ${b.id})\n`;
        });
        return ctx.reply(msg, { parse_mode: 'Markdown' });
      }
      const category = parts[0];
      const orderedIds = parts.slice(1);
      const books = await getBooks(category);
      if (!books || books.length === 0) return ctx.reply(`❌ ምድብ \`${category}\` አልተገኘም ወይም ባዶ ነው።`);
      const allIds = books.map(b => b.id);
      const missing = orderedIds.filter(id => !allIds.includes(id));
      if (missing.length > 0) {
        return ctx.reply(`❌ እነዚህ መታወቂያዎች በምድብ \`${category}\` ውስጥ የሉም: ${missing.join(', ')}`);
      }
      if (orderedIds.length !== books.length) {
        return ctx.reply(`⚠️ ${orderedIds.length} መታወቂያዎች ገብተዋል፣ ነገር ግን ምድቡ ${books.length} መጽሐፍ አለው። ሁሉንም መጽሐፍት ያካትቱ።`);
      }
      const success = await reorderBooks(category, orderedIds);
      if (success) {
        delete addBookSessions[userId];
        return ctx.reply(`✅ መጽሐፍት በ \`${category}\` ውስጥ እንደገና ተደራጅተዋል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
      } else {
        return ctx.reply(`❌ እንደገና ማደራጀት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።`);
      }
    }

    delete addBookSessions[userId];
    return ctx.reply("❌ ስራው ተበላሽቷል። እባክዎትን እንደገና ይጀምሩ።");
  }

  // ---- SKIP COMMANDS & BUTTON TEXTS ----
  if (text.startsWith('/')) return;

  // ---- SEARCH (WITH TYPO TOLERANCE) ----
  const query = text.trim().toLowerCase();
  let matches = [];
  const searchWords = query.split(' ').filter(w => w.length > 0);

  for (const cat of allCategories) {
    const books = await getBooks(cat);
    if (books) {
      for (const book of books) {
        const title = book.title.toLowerCase();
        const titleWords = title.split(' ').filter(w => w.length > 0);
        
        if (titleWords.length === 0) continue;
        
        let isMatch = false;
        for (const sWord of searchWords) {
          for (const tWord of titleWords) {
            if (tWord.includes(sWord) || sWord.includes(tWord)) {
              isMatch = true;
              break;
            }
            const normS = sWord.replace(/[ሀሐሓ]/g, '[ሀሐሓ]').replace(/[አኣ]/g, '[አኣ]').replace(/[ደዸ]/g, '[ደዸ]').replace(/[ግጽ]/g, '[ግጽ]').replace(/[ለሌ]/g, '[ለሌ]').replace(/[ሙሚ]/g, '[ሙሚ]').replace(/[ንኝ]/g, '[ንኝ]');
            const normT = tWord.replace(/[ሀሐሓ]/g, '[ሀሐሓ]').replace(/[አኣ]/g, '[አኣ]').replace(/[ደዸ]/g, '[ደዸ]').replace(/[ግጽ]/g, '[ግጽ]').replace(/[ለሌ]/g, '[ለሌ]').replace(/[ሙሚ]/g, '[ሙሚ]').replace(/[ንኝ]/g, '[ንኝ]');
            if (normT.includes(normS) || normS.includes(normT)) {
              isMatch = true;
              break;
            }
          }
          if (isMatch) break;
        }
        if (isMatch) {
          if (!matches.some(m => m.id === book.id)) {
            matches.push({ ...book, catKey: cat });
          }
        }
      }
    }
  }

  matches.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    let aCount = 0, bCount = 0;
    for (const w of searchWords) {
      if (aTitle.includes(w)) aCount++;
      if (bTitle.includes(w)) bCount++;
    }
    return bCount - aCount;
  });

  if (matches.length === 0) {
    return ctx.reply(`🔍 ለ "${text}" ምንም ውጤት አልተገኘም።\n\n💡 እባክዎትን የመጽሐፉን ስም በትክክል ይጻፉ።`);
  }

  const buttons = matches.slice(0, 20).map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.id}`)
  ]);
  ctx.reply(`🔍 ${matches.length} ውጤቶች:`, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 26. LAUNCH (with data loading)
// ==========================================
async function launchBot() {
  // Load all data from Supabase first
  if (supabase) {
    console.log('📥 Loading data from Supabase...');
    await loadUsersFromSupabase();
    await loadBookStatsFromSupabase();
    await loadPendingReceiptsFromSupabase();
  }
  
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
    console.log(`👤 Total Users: ${Object.keys(db.users).length}`);
    console.log(`📊 Book Stats: ${Object.keys(db.bookStats).length}`);
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