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
const SEARCH_RESULTS_LIMIT = 20;
// Separator that cannot collide with category keys (which use "_") or book ids.
const STATS_KEY_SEP = '::';

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

// --- Shared helper: normalize preview_files into a clean array of
//     { type, fileId } objects, tolerating legacy/malformed data. ---
function normalizePreviewFiles(raw) {
  if (Array.isArray(raw)) {
    return raw.map(normalizePreviewFileEntry).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    let cleaned = raw.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed.map(normalizePreviewFileEntry).filter(Boolean) : [];
      } catch (e) {
        return [{ type: 'document', fileId: cleaned }];
      }
    }
    return [{ type: 'document', fileId: cleaned }];
  }
  return [];
}

// Legacy entries may just be a bare file_id string (type unknown).
function normalizePreviewFileEntry(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return { type: 'document', fileId: entry };
  if (entry.fileId) return { type: entry.type || 'document', fileId: entry.fileId };
  return null;
}

function normalizeBookRecord(book) {
  if (!book) return book;
  book.preview_files = normalizePreviewFiles(book.preview_files);
  // Legacy main file: if file_id is a bare string, wrap it; if file_type missing default to document.
  if (!book.file_type) book.file_type = 'document';
  return book;
}

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

async function supabaseGetAllBooks() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('books').select('*').order('order', { ascending: true });
  if (error) { console.error('Supabase getAllBooks error:', error); return null; }
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
  const previewFiles = normalizePreviewFiles(book.preview_files);

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

// In-memory cache of ALL books, keyed by category. Refreshed on load and
// after every mutation, so hot paths (search, bookcount, random, popular)
// never have to make 30+ sequential network calls per request.
let allBooksCache = {}; // { [category]: Book[] }

function rebuildLocalCacheFromBooksDatabase() {
  allBooksCache = {};
  for (const cat of Object.keys(booksDatabase)) {
    allBooksCache[cat] = (booksDatabase[cat] || []).map(normalizeBookRecord);
  }
}

async function refreshAllBooksCache() {
  if (supabase) {
    const rows = await supabaseGetAllBooks();
    const grouped = {};
    if (rows) {
      for (const row of rows) {
        normalizeBookRecord(row);
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push(row);
      }
    }
    allBooksCache = grouped;
  } else {
    rebuildLocalCacheFromBooksDatabase();
  }
}

// ==========================================
// 5. LOAD USERS FROM SUPABASE
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
      console.log('⚠️ book_stats table not found. Stats will not be loaded.');
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
      console.log('⚠️ pending_receipts table not found. Receipts will not be loaded.');
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
// Fast path: read from in-memory cache. Cache is refreshed after every
// add/remove/reorder and at startup, so this never re-hits the network for
// the common "list books" case.
async function getBooks(category) {
  return allBooksCache[category] || [];
}

async function getAllBooksFlat() {
  const out = [];
  for (const cat of Object.keys(allBooksCache)) {
    for (const b of allBooksCache[cat]) out.push(b);
  }
  return out;
}

async function getBook(id) {
  for (const cat of Object.keys(allBooksCache)) {
    const found = allBooksCache[cat].find(b => b.id === id);
    if (found) return found;
  }
  // Fallback to a direct lookup in case the cache is stale (e.g. book just
  // added from another process instance).
  if (supabase) {
    const book = await supabaseGetBook(id);
    if (book) normalizeBookRecord(book);
    return book;
  }
  return null;
}

async function addBook(book) {
  let result;
  if (supabase) {
    result = await supabaseAddBook(book);
  } else {
    if (!booksDatabase[book.category]) booksDatabase[book.category] = [];
    booksDatabase[book.category].push(book);
    saveLocalDatabase();
    result = book;
  }
  if (result) await refreshAllBooksCache();
  return result;
}

async function removeBook(id) {
  let result;
  if (supabase) {
    result = await supabaseRemoveBook(id);
  } else {
    result = null;
    for (const cat of Object.keys(booksDatabase)) {
      const idx = booksDatabase[cat].findIndex(b => b.id === id);
      if (idx !== -1) {
        result = booksDatabase[cat].splice(idx, 1)[0];
        saveLocalDatabase();
        break;
      }
    }
  }
  if (result) await refreshAllBooksCache();
  return result;
}

async function reorderBooks(category, orderedIds) {
  let result;
  if (supabase) {
    result = await supabaseReorderBooks(category, orderedIds);
  } else {
    if (!booksDatabase[category]) return false;
    const newBooks = [];
    for (const id of orderedIds) {
      const book = booksDatabase[category].find(b => b.id === id);
      if (book) newBooks.push(book);
    }
    const remaining = booksDatabase[category].filter(b => !orderedIds.includes(b.id));
    booksDatabase[category] = [...newBooks, ...remaining];
    saveLocalDatabase();
    result = true;
  }
  if (result) await refreshAllBooksCache();
  return result;
}

// ==========================================
// 8. ADD BOOK SESSIONS
// ==========================================
const addBookSessions = {};
// Sessions older than this are considered abandoned and are swept up so
// memory doesn't grow unbounded if an admin walks away mid-flow.
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function touchSession(userId) {
  if (addBookSessions[userId]) addBookSessions[userId]._lastActive = Date.now();
}

setInterval(() => {
  const now = Date.now();
  for (const userId of Object.keys(addBookSessions)) {
    const s = addBookSessions[userId];
    if (s._lastActive && now - s._lastActive > SESSION_TIMEOUT_MS) {
      delete addBookSessions[userId];
    }
  }
}, 10 * 60 * 1000);

// ==========================================
// 9. OTHER HELPERS
// ==========================================
function isAdmin(userId) { return ADMIN_IDS.includes(userId); }

function isPaidUser(userId) {
  if (isAdmin(userId)) return true;
  if (db.users[userId] && db.users[userId].is_paid === true) return true;
  return false;
}

function defaultUserRecord(from) {
  return {
    username: from && from.username ? `@${from.username}` : "No Username",
    is_paid: false,
    registration_date: new Date().toISOString(),
    preferred_language: null,
    total_downloads: 0,
    books_downloaded: []
  };
}

async function registerUser(from) {
  if (!db.users[from.id]) {
    db.users[from.id] = defaultUserRecord(from);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({ id: from.id, ...db.users[from.id] }, { onConflict: 'id' });
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

async function markUserPaid(userId, fromHint) {
  // Ensure a full, well-formed record exists even if the user never ran /start.
  if (!db.users[userId]) {
    db.users[userId] = defaultUserRecord(fromHint || { id: userId });
  }
  db.users[userId].is_paid = true;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ id: userId, ...db.users[userId] }, { onConflict: 'id' });
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
  const bookKey = `${catKey}${STATS_KEY_SEP}${bookId}`;
  if (!db.users[userId].books_downloaded.includes(bookKey)) {
    db.users[userId].books_downloaded.push(bookKey);
  }
  if (!db.bookStats) db.bookStats = {};
  if (!db.bookStats[bookKey]) db.bookStats[bookKey] = 0;
  db.bookStats[bookKey]++;

  if (supabase) {
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({
          total_downloads: db.users[userId].total_downloads,
          books_downloaded: db.users[userId].books_downloaded
        })
        .eq('id', userId);
      if (userError) console.error('Error updating user stats:', userError);

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

// Non-blocking log writes. Note: on hosts with an ephemeral filesystem
// (e.g. Render's free tier) these files won't survive a restart/redeploy —
// treat them as best-effort debugging aids, not durable audit logs.
function logActivity(userId, action, details) {
  try {
    const logFile = path.join(__dirname, 'activity.log');
    const entry = `[${new Date().toISOString()}] User: ${userId} | ${action} | ${JSON.stringify(details)}\n`;
    fs.appendFile(logFile, entry, () => {});
  } catch (e) { /* ignore */ }
}

function logError(type, error) {
  try {
    const logFile = path.join(__dirname, 'error.log');
    const entry = `[${new Date().toISOString()}] ${type}: ${error.stack || error}\n`;
    fs.appendFile(logFile, entry, () => {});
  } catch (e) { /* ignore */ }
}

// Swallow reply errors (e.g. user blocked the bot) so they don't become
// unhandled promise rejections.
async function safeReply(ctx, ...args) {
  try {
    return await ctx.reply(...args);
  } catch (e) {
    console.error('reply failed:', e.message);
  }
}

async function safeAnswerCbQuery(ctx, ...args) {
  try {
    await ctx.answerCbQuery(...args);
  } catch (e) { /* ignore - callback may have expired */ }
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
    safeAnswerCbQuery(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ! (30/ደቂቃ)");
    return false;
  }
  return true;
}

// Periodically drop empty rate-limit buckets so memory doesn't grow forever
// as new unique users show up over the bot's lifetime.
setInterval(() => {
  const now = Date.now();
  for (const userId of Object.keys(userRequests)) {
    userRequests[userId] = userRequests[userId].filter(t => now - t < RATE_WINDOW);
    if (userRequests[userId].length === 0) delete userRequests[userId];
  }
}, RATE_WINDOW);

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
  if (!checkRateLimit(userId)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  const user = db.users[userId];

  let msg = "እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት በሰላም መጡ! 📚✨\n\n";
  msg += "ይህ ቦት የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያንን መንፈሳዊ መጽሐፍት በዲጂታል መልክ እንዲያገኙ ያስችልዎታል።\n\n";
  msg += user.is_paid ? "✅ ክፍያ ፈጽመዋል! ሁሉንም መጽሐፍት በነጻነት ማንበብ ይችላሉ።\n" : "💰 200 ብር በመክፈል ሁሉንም መጽሐፍት ሙሉ በሙሉ ማግኘት ይችላሉ።\n";
  msg += `📚 እስካሁን ${user.total_downloads || 0} መጽሐፍት አውርደዋል።\n\n`;
  msg += "📖 ከስር ያሉትን ቁልፎች በመጫን መጽሐፍትን ያስሱ።\n\n";
  msg += "👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን";

  safeReply(ctx, msg, mainKeyboard);
});

// ==========================================
// 14. MAIN KEYBOARD HANDLERS
// ==========================================

bot.hears('📚 መጽሐፍት', async (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  const user = db.users[userId];

  if (user.preferred_language) {
    const lang = user.preferred_language;
    if (lang === 'geez') {
      return safeReply(ctx, "በግዕዝ ምድብ ይምረጡ:", Markup.inlineKeyboard([
        [Markup.button.callback("ሕግና ሥርዓት", "cat_geez_law")],
        [Markup.button.callback("ታሪክና ድርሳናት", "sub_geez_hist")],
        [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_geez_bible")],
        [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
      ]));
    } else if (lang === 'geez_amharic') {
      return safeReply(ctx, "በግዕዝ አማርኛ ምድብ ይምረጡ:", Markup.inlineKeyboard([
        [Markup.button.callback("ሕግና ሥርዓት", "cat_ga_law")],
        [Markup.button.callback("ታሪክና ድርሳናት", "sub_ga_hist")],
        [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_ga_bible")],
        [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
      ]));
    } else if (lang === 'amharic') {
      return safeReply(ctx, "በአማርኛ ምድብ ይምረጡ:", Markup.inlineKeyboard([
        [Markup.button.callback("ሕግና ሥርዓት", "cat_amh_law")],
        [Markup.button.callback("ታሪክና ድርሳናት", "sub_amh_hist")],
        [Markup.button.callback("ክርስቲያናዊ ሥነ ምግባር", "cat_amh_eth")],
        [Markup.button.callback("የመጽሐፍ ቅዱስ ጥናት", "sub_amh_bible")],
        [Markup.button.callback("ነገረ ሃይማኖት", "sub_amh_theology")],
        [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
      ]));
    } else if (lang === 'english') {
      return safeReply(ctx, "Select category:", Markup.inlineKeyboard([
        [Markup.button.callback("Law & Order", "cat_eng_law")],
        [Markup.button.callback("History & Discourse", "sub_eng_hist")],
        [Markup.button.callback("Christian Ethics", "cat_eng_eth")],
        [Markup.button.callback("Bible Study", "sub_eng_bible")],
        [Markup.button.callback("Theology & Dogma", "sub_eng_theology")],
        [Markup.button.callback("⬅️ Back", "back_to_lang")]
      ]));
    }
  }
  safeReply(ctx, "እባኮን ቋንቋ ይምረጡ:", Markup.inlineKeyboard([
    [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
    [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
    [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("In English", "lang_eng")]
  ]));
});

bot.hears('🔍 መጽሐፍ ፈልግ', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  safeReply(ctx, "🔍 እባክዎትን የመጽሐፍ ስም ያስገቡ፦");
});

bot.hears('📞 አግኙኝ', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  safeReply(ctx,
    `📞 *የአስተዳዳሪ መረጃ*\n\n` +
    `➖ ቴሌግራም: ${ADMIN_USERNAME}\n` +
    `➖ ኢሜይል: ${ADMIN_EMAIL}\n\n` +
    `ማንኛውንም ጥያቄ ወይም ችግር በላይኛው አድራሻ ያናግሩን።\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('💬 አስተያየት', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  safeReply(ctx,
    `💬 *አስተያየት ወይም ሀሳብ*\n\n` +
    `ሀሳብዎን፣ አስተያየትዎን ወይም ማሻሻያ ሀሳብዎን በሚከተሉት አድራሻዎች ያሳውቁን።\n\n` +
    `➖ ቴሌግራም: ${ADMIN_USERNAME}\n` +
    `➖ ኢሜይል: ${ADMIN_EMAIL}\n\n` +
    `አስተያየትዎ ውድ ነው! 🙏\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📊 ስታቲስቲክስ', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  const stats = getUserStats(ctx.from.id);
  if (!stats) return safeReply(ctx, "❌ መረጃ አልተገኘም።");
  safeReply(ctx,
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

bot.hears('🔄 ዳግም ጀምር', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  await registerUser(ctx.from);
  safeReply(ctx, "👋 እንኳን ወደ ቦቱ በሰላም ተመለሱ! ከስር ያሉትን ቁልፎች በመጫን መጽሐፍትን ያስሱ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን", mainKeyboard);
});

// ==========================================
// 15. ALL COMMANDS
// ==========================================

bot.command('help', (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  safeReply(ctx,
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

// 📚 BOOKCOUNT COMMAND (uses cache — no per-request DB fan-out)
bot.command('bookcount', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  try {
    let total = 0;
    let msg = '📚 *የመጽሐፍ ብዛት*\n\n';
    let hasBooks = false;

    for (const cat of allCategories) {
      const books = await getBooks(cat);
      const validBooks = books.filter(b => b.title && b.title.trim().length > 0 && b.title !== 'null' && b.title !== 'undefined');
      if (validBooks.length > 0) {
        hasBooks = true;
        total += validBooks.length;
        msg += `• ${cat}: ${validBooks.length}\n`;
      }
    }

    if (!hasBooks) {
      return safeReply(ctx, '📚 *የመጽሐፍ ብዛት*\n\nምንም መጽሐፍ አልተገኘም። እባክዎትን በኋላ ይመለሱ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን', { parse_mode: 'Markdown' });
    }

    msg += `\n*ጠቅላላ መጽሐፍት: ${total}*\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`;
    await safeReply(ctx, msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Bookcount error:', error);
    safeReply(ctx, '❌ የመጽሐፍ ብዛት ማግኘት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።');
  }
});

// 🏆 POPULAR COMMAND (fixed key parsing)
bot.command('popular', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  if (!db.bookStats || Object.keys(db.bookStats).length === 0) {
    return safeReply(ctx, '📊 እስካሁን ምንም መጽሐፍ አልተወረደም።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን');
  }
  const sorted = Object.entries(db.bookStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let msg = '🏆 *በብዛት የተወረዱ መጽሐፍት*\n\n';
  for (const [key, count] of sorted) {
    const sepIdx = key.indexOf(STATS_KEY_SEP);
    if (sepIdx === -1) continue; // legacy/malformed key, skip
    const cat = key.slice(0, sepIdx);
    const id = key.slice(sepIdx + STATS_KEY_SEP.length);
    const book = await getBook(id);
    if (book) {
      msg += `• ${book.title} (${cat}) – ${count} ውርዶች\n`;
    }
  }
  msg += `\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`;
  safeReply(ctx, msg, { parse_mode: 'Markdown' });
});

// 🎲 RANDOM COMMAND (uses cache)
bot.command('random', async (ctx) => {
  if (!checkRateLimit(ctx.from.id)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");
  try {
    const allBooks = (await getAllBooksFlat()).filter(
      b => b.title && b.title.trim().length > 0 && b.title !== 'null' && b.title !== 'undefined'
    );

    if (allBooks.length === 0) {
      return safeReply(ctx, '📚 ምንም መጽሐፍ የለም። እባክዎትን በኋላ ይመለሱ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን');
    }

    const book = allBooks[Math.floor(Math.random() * allBooks.length)];
    await safeReply(ctx, `📖 *የዘፈቀደ መጽሐፍ*\n\n📕 ${book.title}\n📂 ምድብ: ${book.category}\n🆔 መታወቂያ: ${book.id}\n\nከስር ያለውን ቁልፍ በመጫን ያንብቡ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📖 አንብብ", `gb_${book.id}`)]
      ])
    });
  } catch (error) {
    console.error('Random error:', error);
    safeReply(ctx, '❌ የዘፈቀደ መጽሐፍ ማግኘት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።');
  }
});

// 📕 ADD BOOK COMMAND
bot.command('addbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return safeReply(ctx, "⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  if (addBookSessions[userId]) return safeReply(ctx, "⚠️ አሁን መጽሐፍ እየጨመሩ ነው። /canceladd ይጠቀሙ።");
  addBookSessions[userId] = { step: 'title', previewFiles: [], _lastActive: Date.now() };
  safeReply(ctx,
    `📚 *አዲስ መጽሐፍ መጨመር*\n\n` +
    `**ደረጃ 1: የመጽሐፍ ርዕስ ያስገቡ**\n\n` +
    `ለምሳሌ: \`ድርሳነ ሚካኤል ብራና\`\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('canceladd', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    safeReply(ctx, "❌ መጽሐፍ መጨመር ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  } else {
    safeReply(ctx, "⚠️ ምንም እየተጨመረ ያለ መጽሐፍ የለም።");
  }
});

bot.command('removebook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return safeReply(ctx, "⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  if (addBookSessions[userId]) return safeReply(ctx, "⚠️ አሁን ሌላ ስራ እየሰሩ ነው። /cancel ይጠቀሙ።");
  addBookSessions[userId] = { step: 'remove_waiting', _lastActive: Date.now() };
  safeReply(ctx, "🗑️ *መጽሐፍ መሰረዝ*\n\nየመጽሐፉን መታወቂያ (ID) ያስገቡ።\nለምሳሌ: `amh_law_1`\n\nለመሰረዝ /cancel ይጠቀሙ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን", { parse_mode: 'Markdown' });
});

// 🔄 ORDER BOOK COMMAND (instructions now match validation: full book IDs
// are required, OR bare per-category sequence numbers are accepted and
// auto-expanded to full IDs).
bot.command('orderbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) return safeReply(ctx, "⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  if (addBookSessions[userId]) return safeReply(ctx, "⚠️ አሁን ሌላ ስራ እየሰሩ ነው።");
  addBookSessions[userId] = { step: 'order_waiting', _lastActive: Date.now() };
  safeReply(ctx,
    "🔄 *መጽሐፍትን እንደገና ማደራጀት*\n\n" +
    "የምድቡን ስም እና አዲሱን ቅደም ተከተል በ ID ያስገቡ። ሙሉ IDs ወይም ቁጥር ብቻ መጠቀም ይችላሉ።\n\n" +
    "ለምሳሌ (ሙሉ ID):\n`amh_law amh_law_3 amh_law_1 amh_law_5 amh_law_2 amh_law_4`\n\n" +
    "ወይም (ቁጥር ብቻ):\n`amh_law 3 1 5 2 4`\n\n" +
    "የምድቡን የአሁኑን ቅደም ተከተል ለማየት የምድቡን ስም ብቻ ይላኩ (ለምሳሌ `amh_law`)።\n\n" +
    "ለመሰረዝ /cancel ይጠቀሙ።\n\n" +
    "👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን", { parse_mode: 'Markdown' }
  );
});

bot.command('cancel', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    safeReply(ctx, "❌ ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  } else {
    safeReply(ctx, "⚠️ ምንም እየተሰራ ያለ ስራ የለም።");
  }
});

bot.command('stats', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const total = Object.keys(db.users).length;
  const paid = Object.values(db.users).filter(u => u.is_paid).length;
  safeReply(ctx,
    `📊 *የቦት መረጃ*\n\n` +
    `👤 ጠቅላላ ተጠቃሚዎች: ${total}\n` +
    `💰 የከፈሉ: ${paid}\n` +
    `📖 ነጻ: ${total - paid}\n\n` +
    `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    { parse_mode: 'Markdown' }
  );
});

// 💾 BACKUP COMMAND (now includes books)
bot.command('backup', async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return safeReply(ctx, "⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው!");
  }
  try {
    const books = supabase ? (await supabaseGetAllBooks()) : booksDatabase;
    const backupData = {
      users: db.users,
      pendingReceipts: db.pendingReceipts,
      bookStats: db.bookStats,
      books
    };
    await ctx.replyWithDocument({
      source: Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8'),
      filename: `backup_${Date.now()}.json`
    }, { caption: `📦 የውሂብ ምትኬ\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን` });
  } catch (error) {
    console.error('Backup error:', error);
    safeReply(ctx, "❌ ምትኬ ማውጣት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።");
  }
});

// ==========================================
// 16. CATEGORY HANDLER (capped list + answerCbQuery)
// ==========================================
bot.action(/^cat_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const catKey = ctx.match[1];
  const books = await getBooks(catKey);
  if (!books || books.length === 0) {
    return safeAnswerCbQuery(ctx, "ምንም መጽሐፍ የለም", { show_alert: true });
  }
  const MAX_BUTTONS = 80; // keep well under Telegram's inline keyboard limits
  const shown = books.slice(0, MAX_BUTTONS);
  const buttons = shown.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.id}`)
  ]);
  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);
  const headerText = books.length > MAX_BUTTONS
    ? `መጽሐፍ ይምረጡ (የመጀመሪያዎቹ ${MAX_BUTTONS}/${books.length}):`
    : "መጽሐፍ ይምረጡ:";
  await ctx.editMessageText(headerText, Markup.inlineKeyboard(buttons));
  safeAnswerCbQuery(ctx);
});

// ==========================================
// 17. BOOK HANDLER
// ==========================================
bot.action(/^gb_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) {
    return safeAnswerCbQuery(ctx, "መጽሐፉ አልተገኘም", { show_alert: true });
  }
  safeAnswerCbQuery(ctx);

  const previewContent = book.preview || 'ምንም ቅድመ እይታ የለም።';
  const previewText = `📖 *${book.title}*\n\n📄 *ቅድመ እይታ*\n\n${previewContent}\n\n━━━━━━━━━━━━━━━━━━━━━\n`;

  if (!isPaidUser(userId)) {
    return safeReply(ctx,
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

  return safeReply(ctx,
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

// Send a book/preview file using its recorded type, with a graceful
// fallback chain if the stored type turns out to be wrong.
async function sendFileSmart(ctx, type, fileId, options) {
  const senders = {
    document: () => ctx.replyWithDocument(fileId, options),
    photo: () => ctx.replyWithPhoto(fileId, options),
    video: () => ctx.replyWithVideo(fileId, options),
    audio: () => ctx.replyWithAudio(fileId, options),
    voice: () => ctx.replyWithVoice(fileId, options)
  };
  const order = [type, 'document', 'photo', 'video', 'audio', 'voice'].filter(
    (t, i, arr) => senders[t] && arr.indexOf(t) === i
  );
  let lastErr = null;
  for (const t of order) {
    try {
      await senders[t]();
      return true;
    } catch (e) {
      lastErr = e;
    }
  }
  console.error('sendFileSmart failed for all types:', lastErr && lastErr.message);
  return false;
}

// ==========================================
// 18. DOWNLOAD HANDLER (for paid users) — uses stored file_type
// ==========================================
bot.action(/^download_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) {
    return safeAnswerCbQuery(ctx, "መጽሐፉ አልተገኘም", { show_alert: true });
  }

  if (!isPaidUser(userId)) {
    safeAnswerCbQuery(ctx);
    return safeReply(ctx, "⛔ ክፍያ አልፈጸሙም። እባክዎትን መጀመሪያ ይክፈሉ።");
  }
  safeAnswerCbQuery(ctx);

  const ok = await sendFileSmart(ctx, book.file_type, book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
    protect_content: true
  });
  if (ok) {
    trackDownload(userId, book.category, book.id);
  } else {
    safeReply(ctx, `❌ መጽሐፉን መላክ አልተሳካም። እባክዎትን እንደገና ይሞክሩ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  }
});

// ==========================================
// 19. PREVIEW HANDLER — uses stored file_type per preview file
// ==========================================
bot.action(/^preview_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const bookId = ctx.match[1];
  const book = await getBook(bookId);
  if (!book) {
    safeAnswerCbQuery(ctx, "መጽሐፉ አልተገኘም", { show_alert: true });
    return safeReply(ctx, "❌ መጽሐፉ አልተገኘም።");
  }
  safeAnswerCbQuery(ctx);

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

  await safeReply(ctx, previewText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📖 ሙሉ መጽሐፍ አንብብ", `gb_${book.id}`)],
      [Markup.button.callback("⬅️ ተመለስ", `cat_${book.category}`)]
    ])
  });

  if (previewFiles.length > 0) {
    let sentCount = 0;
    let errorCount = 0;

    for (const entry of previewFiles) {
      if (!entry || !entry.fileId) { errorCount++; continue; }
      const ok = await sendFileSmart(ctx, entry.type, entry.fileId, { caption: `📎 ቅድመ እይታ ፋይል` });
      if (ok) sentCount++; else errorCount++;
    }

    if (errorCount > 0) {
      await safeReply(ctx, `⚠️ ${errorCount} ፋይሎች መላክ አልተቻለም። እባክዎትን እንደገና ይሞክሩ።`);
    } else if (sentCount > 0) {
      await safeReply(ctx, `✅ ${sentCount} ፋይሎች ተልከዋል።`);
    }
  }
});

// ==========================================
// 20. SUB-MENU ACTIONS
// ==========================================
bot.action("lang_geez", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez";
    if (!supabase) saveLocalDatabase();
  }
  await ctx.editMessageText(
    "በግዕዝ ምድብ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_geez_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_geez_hist")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_geez_bible")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_geez_hist", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከታሪክና ድርሳናት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_geez_hist")],
      [Markup.button.callback("ገድል ተአምር ድርሳን", "cat_geez_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_geez")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_geez_bible", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_geez_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_geez_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_geez")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("lang_ga", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez_amharic";
    if (!supabase) saveLocalDatabase();
  }
  await ctx.editMessageText(
    "በግዕዝ አማርኛ ምድብ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_ga_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_ga_hist")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_ga_bible")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_ga_hist", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከታሪክና ድርሳናት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_ga_hist")],
      [Markup.button.callback("ገድል ተአምር ድርሳን", "cat_ga_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_ga_bible", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_ga_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_ga_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("lang_amh", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "amharic";
    if (!supabase) saveLocalDatabase();
  }
  await ctx.editMessageText(
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
  safeAnswerCbQuery(ctx);
});

bot.action("sub_amh_hist", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከታሪክና ድርሳናት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_amh_hist")],
      [Markup.button.callback("ድርሳን ተአምር ገድላት", "cat_amh_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_amh_bible", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_amh_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_amh_nt")],
      [Markup.button.callback("መጽሐፍ ቅዱስ ጥናት", "cat_amh_std")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_amh_theology", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "ከነገረ ሃይማኖት ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ነገረ ክርስቶስ", "cat_amh_chr")],
      [Markup.button.callback("ነገረ ማርያም", "cat_amh_mry")],
      [Markup.button.callback("ነገረ ቅዱሳን", "cat_amh_snt")],
      [Markup.button.callback("ነገረ ሃይማኖት", "cat_amh_thl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("lang_eng", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "english";
    if (!supabase) saveLocalDatabase();
  }
  await ctx.editMessageText(
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
  safeAnswerCbQuery(ctx);
});

bot.action("sub_eng_hist", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("History", "cat_eng_hist")],
      [Markup.button.callback("Discourse & Miracles", "cat_eng_gdsl")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_eng_bible", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Old Testament", "cat_eng_ot")],
      [Markup.button.callback("New Testament", "cat_eng_nt")],
      [Markup.button.callback("General Bible Study", "cat_eng_std")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("sub_eng_theology", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Christology", "cat_eng_chr")],
      [Markup.button.callback("Mariology", "cat_eng_mry")],
      [Markup.button.callback("Hagiography", "cat_eng_snt")],
      [Markup.button.callback("Theology", "cat_eng_thl")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

bot.action("back_to_lang", async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  await ctx.editMessageText(
    "እባኮን ቋንቋ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
      [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
      [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("In English", "lang_eng")]
    ])
  );
  safeAnswerCbQuery(ctx);
});

// ==========================================
// 21. ADD CATEGORY BUTTON (for addbook flow)
// ==========================================
bot.action(/^addcat_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  const category = ctx.match[1];
  if (!isAdmin(userId)) return safeAnswerCbQuery(ctx, "⛔ Admin only!", { show_alert: true });
  if (!addBookSessions[userId]) return safeAnswerCbQuery(ctx, "⚠️ /addbook first!", { show_alert: true });
  const session = addBookSessions[userId];
  session.category = category;
  session.step = 'file';
  touchSession(userId);
  await ctx.editMessageText(
    `✅ ምድብ: \`${category}\`\n\n📎 *ደረጃ 4: የመጽሐፉን ፋይል ይላኩ*\n\n📤 ዋናውን የመጽሐፍ ፋይል (ፒዲኤፍ፣ ፎቶ፣ ቪዲዮ፣ ወዘተ) ይላኩ።\n\n💡 ይህ የመጨረሻ ደረጃ ነው!`,
    { parse_mode: 'Markdown' }
  );
  safeAnswerCbQuery(ctx);
});

bot.action('cancel_add_book', async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    await ctx.editMessageText("❌ መጽሐፍ መጨመር ተሰርዟል።");
  } else {
    return safeAnswerCbQuery(ctx, "❌ ምንም እየተጨመረ ያለ መጽሐፍ የለም");
  }
  safeAnswerCbQuery(ctx);
});

// ==========================================
// 22. ADMIN ACTIONS (Approve/Reject)
// ==========================================
bot.action(/^approve_(\d+)_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  if (!isAdmin(ctx.from.id)) return safeAnswerCbQuery(ctx, "⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  await markUserPaid(userId);
  try {
    await ctx.telegram.sendMessage(userId, `✅ ክፍያ #${orderNumber} ጸድቋል! 🎉\n\nሁሉም መጽሐፍት ተከፍተዋል! መልካም ንባብ! 📚✨\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  } catch (e) { console.error('Failed to notify user of approval:', e.message); }
  await ctx.editMessageText(`✅ #${orderNumber} ጸድቋል`);
  safeAnswerCbQuery(ctx);
});

bot.action(/^reject_(\d+)_(.+)$/, async (ctx) => {
  if (!checkRateLimitCallback(ctx)) return;
  if (!isAdmin(ctx.from.id)) return safeAnswerCbQuery(ctx, "⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  try {
    await ctx.telegram.sendMessage(userId, `❌ ክፍያ #${orderNumber} አልጸደቀም። እባክዎትን ትክክለኛ ሪሲት ይላኩ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  } catch (e) { console.error('Failed to notify user of rejection:', e.message); }
  await ctx.editMessageText(`❌ #${orderNumber} አልጸደቀም`);
  safeAnswerCbQuery(ctx);
});

// ==========================================
// 23. FILE HANDLER
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
  if (!checkRateLimit(userId)) return safeReply(ctx, "⏳ እባክዎትን ትንሽ ይጠብቁ!");

  // ---- ADD BOOK: step === 'preview' (preview files, now keep type) ----
  if (addBookSessions[userId] && addBookSessions[userId].step === 'preview') {
    const session = addBookSessions[userId];
    touchSession(userId);
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return safeReply(ctx, "❌ የፋይሉ መረጃ አልተገኘም።");

    if (!session.previewFiles) session.previewFiles = [];
    session.previewFiles.push({ type: fileInfo.type, fileId: fileInfo.fileId });

    await safeReply(ctx, `✅ ቅድመ እይታ ፋይል #${session.previewFiles.length} ተጨምሯል! 📎\n\nሌላ ፋይል መላክ ይችላሉ ወይም ለማጠናቀቅ /done ይተይቡ።`);
    return;
  }

  // ---- ADD BOOK: step === 'file' (final book file, now keeps type) ----
  if (addBookSessions[userId] && addBookSessions[userId].step === 'file') {
    const session = addBookSessions[userId];
    touchSession(userId);
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return safeReply(ctx, "❌ የፋይሉ መረጃ አልተገኘም።");
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
      file_type: fileInfo.type,
      title: session.title,
      preview: session.preview || 'Preview not available',
      preview_files: session.previewFiles || []
    };

    const result = await addBook(newBook);
    if (result) {
      delete addBookSessions[userId];
      safeReply(ctx,
        `✅ *መጽሐፍ በተሳካ ሁኔታ ተመዝግቧል!* 📚\n\n` +
        `📂 ምድብ: ${category}\n` +
        `🆔 መታወቂያ: ${newId}\n` +
        `📄 ርዕስ: ${session.title}\n` +
        `📎 የቅድመ እይታ ፋይሎች: ${session.previewFiles ? session.previewFiles.length : 0}\n\n` +
        `👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        { parse_mode: 'Markdown' }
      );
      logActivity(userId, 'add_book', { category, bookId: newId, title: session.title, previewFileCount: (session.previewFiles || []).length });
    } else {
      safeReply(ctx, "❌ መጽሐፍ መጨመር አልተሳካም። እባክዎትን እንደገና ይሞክሩ።");
    }
    return;
  }

  // ---- ADMIN: get file ID (utility) ----
  if (isAdmin(userId)) {
    const fileInfo = extractFileInfo(message);
    if (fileInfo) {
      return safeReply(ctx,
        `🔑 *የፋይል መታወቂያ*\n\n📄 ${fileInfo.fileName}\n🆔 \`${fileInfo.fileId}\`\n📁 ${fileInfo.type}\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        { parse_mode: 'Markdown' }
      );
    }
    return safeReply(ctx, "⚠️ የፋይሉ መረጃ አልተገኘም።");
  }

  // ---- PAID USER ----
  if (isPaidUser(userId)) {
    return safeReply(ctx, "✅ ክፍያ ፈጽመዋል። ፋይልዎ ተቀብለናል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  }

  // ---- NON-PAID: RECEIPT ----
  const fileInfo = extractFileInfo(message);
  if (!fileInfo) {
    return safeReply(ctx, "⚠️ እባክዎትን የባንክ ሪሲት ይላኩ።");
  }

  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  try {
    const forwardedMsg = await ctx.telegram.forwardMessage(ADMIN_IDS[0], ctx.chat.id, message.message_id);

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
    } else {
      db.pendingReceipts[forwardedMsg.message_id] = { userId, orderNumber, confidence: 100 };
      saveLocalDatabase();
    }

    for (const adminId of ADMIN_IDS) {
      await ctx.telegram.sendMessage(adminId,
        `📥 *አዲስ ሪሲት*\n\n🧾 ${orderNumber}\n👤 ${userId}\n📁 ${fileInfo.fileName}\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ አጽድቅ", `approve_${userId}_${orderNumber}`)],
            [Markup.button.callback("❌ ውድቅ", `reject_${userId}_${orderNumber}`)]
          ])
        }
      );
    }
    safeReply(ctx, `✅ ሪሲት ተቀብለናል! 🧾 ${orderNumber}\n\nአስተዳዳሪ በቅርቡ ያረጋግጣል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
  } catch (error) {
    console.error('Forward failed:', error);
    safeReply(ctx, "⚠️ ሪሲት ማስተናገድ አልተሳካም። እባክዎትን እንደገና ይሞክሩ ወይም አስተዳዳሪውን ያናግሩ።");
  }
});

// ==========================================
// 24. SEARCH NORMALIZATION (fixed homophone tolerance)
// ==========================================
// Map visually/phonetically similar Amharic/Ge'ez characters to a single
// canonical character, so "ሀ" and "ሐ" and "ሓ" all compare equal. This
// replaces the previous broken implementation, which stringified entire
// character classes into literal text instead of truly canonicalizing.
const HOMOPHONE_GROUPS = [
  ['ሀ', 'ሐ', 'ሓ', 'ኀ', 'ኃ'],
  ['አ', 'ኣ', 'ዐ', 'ዓ'],
  ['ደ', 'ዸ'],
  ['ጸ', 'ፀ'],
  ['ለ', 'ሌ'],
  ['ሰ', 'ሠ'],
  ['ጽ', 'ፅ'],
  ['ሙ', 'ሚ'],
  ['ን', 'ኝ']
];
const CHAR_CANON_MAP = new Map();
for (const group of HOMOPHONE_GROUPS) {
  const canon = group[0];
  for (const ch of group) CHAR_CANON_MAP.set(ch, canon);
}
function canonicalizeWord(word) {
  let out = '';
  for (const ch of word) out += CHAR_CANON_MAP.get(ch) || ch;
  return out;
}

// ==========================================
// 25. TEXT HANDLER
// ==========================================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  logActivity(userId, 'text_received', { text });

  // ---- CANCEL ----
  if (text === '/cancel' && addBookSessions[userId]) {
    delete addBookSessions[userId];
    return safeReply(ctx, "❌ ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
  }

  // ---- ADD BOOK FLOW ----
  if (addBookSessions[userId]) {
    const session = addBookSessions[userId];
    touchSession(userId);

    if (session.step === 'title') {
      session.title = text.trim();
      session.step = 'preview';
      session.preview = '';
      session.previewFiles = [];
      return safeReply(ctx,
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
          return safeReply(ctx, "⚠️ እባክዎትን ቢያንስ ቅድመ እይታ ጽሑፍ (10 ፊደላት) ወይም አንድ ቅድመ እይታ ፋይል ይላኩ።");
        }
        session.step = 'category';
        const buttons = [];
        for (let i = 0; i < allCategories.length; i += 2) {
          const row = [];
          row.push(Markup.button.callback(allCategories[i], `addcat_${allCategories[i]}`));
          if (i + 1 < allCategories.length) row.push(Markup.button.callback(allCategories[i + 1], `addcat_${allCategories[i + 1]}`));
          buttons.push(row);
        }
        buttons.push([Markup.button.callback("❌ ሰርዝ", "cancel_add_book")]);
        return safeReply(ctx,
          `✅ ቅድመ እይታ ተቀምጧል!\n` +
          `📎 ${session.previewFiles ? session.previewFiles.length : 0} ፋይሎች ተቀምጠዋል።\n\n` +
          `📂 *ደረጃ 3: ምድብ ይምረጡ*`,
          Markup.inlineKeyboard(buttons)
        );
      }
      if (!session.preview) session.preview = text;
      else session.preview += '\n\n' + text;
      const wordCount = session.preview.split(' ').length;
      return safeReply(ctx, `📄 ተዘምኗል! (${wordCount} ቃላት) ፋይሎችን መላክ ይችላሉ ወይም /done ይተይቡ።`);
    }

    if (session.step === 'file') {
      return safeReply(ctx, "📤 እባክዎትን ዋናውን የመጽሐፍ ፋይል (ፒዲኤፍ፣ ፎቶ፣ ቪዲዮ፣ ወዘተ) ይላኩ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን");
    }

    // ---- REMOVE BOOK FLOW ----
    if (session.step === 'remove_waiting') {
      const bookId = text.trim();
      const book = await getBook(bookId);
      if (!book) {
        return safeReply(ctx, `❌ መታወቂያ \`${bookId}\` ያለው መጽሐፍ አልተገኘም።`, { parse_mode: 'Markdown' });
      }
      session.remove_book_id = bookId;
      session.step = 'remove_confirm';
      return safeReply(ctx,
        `📖 *ተገኘ:*\n\nርዕስ: ${book.title}\nምድብ: ${book.category}\nመታወቂያ: ${book.id}\n\n❓ ይህንን መጽሐፍ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?\n**እዎ** ወይም **አይ** ይተይቡ።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`
      );
    }

    if (session.step === 'remove_confirm') {
      if (text.toLowerCase() === 'እዎ' || text.toLowerCase() === 'yes') {
        const bookId = session.remove_book_id;
        const result = await removeBook(bookId);
        if (result) {
          delete addBookSessions[userId];
          return safeReply(ctx, `✅ መጽሐፍ \`${bookId}\` ተሰርዟል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`);
        } else {
          return safeReply(ctx, `❌ መጽሐፍ መሰረዝ አልተሳካም። እባክዎትን እንደገና ይሞክሩ።`);
        }
      } else {
        delete addBookSessions[userId];
        return safeReply(ctx, "❌ መሰረዝ ተሰርዟል።");
      }
    }

    // ---- ORDER BOOK FLOW (now matches documented usage; supports bare
    //      numeric sequence numbers AND full IDs; single-word input shows
    //      the current order) ----
    if (session.step === 'order_waiting') {
      const parts = text.trim().split(/\s+/);
      const category = parts[0];
      if (!category) return safeReply(ctx, "❌ እባክዎትን ይህን ይተይቡ: `ምድብ ID1 ID2 ...`", { parse_mode: 'Markdown' });

      const books = await getBooks(category);
      if (!books || books.length === 0) return safeReply(ctx, `❌ ምድብ \`${category}\` ምንም መጽሐፍ የለውም ወይም አልተገኘም።`, { parse_mode: 'Markdown' });

      if (parts.length < 2) {
        let msg = `📚 *የአሁኑ ቅደም ተከተል ለ ${category}:*\n\n`;
        books.forEach((b, i) => {
          msg += `${i + 1}. ${b.title} (መታወቂያ: ${b.id})\n`;
        });
        return safeReply(ctx, msg, { parse_mode: 'Markdown' });
      }

      // Accept either full IDs ("amh_law_3") or bare sequence numbers ("3")
      // and normalize everything to full IDs.
      const rawIds = parts.slice(1);
      const orderedIds = rawIds.map(token => {
        if (/^\d+$/.test(token)) return `${category}_${token}`;
        return token;
      });

      const allIds = books.map(b => b.id);
      const missing = orderedIds.filter(id => !allIds.includes(id));
      if (missing.length > 0) {
        return safeReply(ctx, `❌ እነዚህ መታወቂያዎች በምድብ \`${category}\` ውስጥ የሉም: ${missing.join(', ')}`, { parse_mode: 'Markdown' });
      }
      if (orderedIds.length !== books.length) {
        return safeReply(ctx, `⚠️ ${orderedIds.length} መታወቂያዎች ገብተዋል፣ ነገር ግን ምድቡ ${books.length} መጽሐፍ አለው። ሁሉንም መጽሐፍት ያካትቱ።`);
      }
      const success = await reorderBooks(category, orderedIds);
      if (success) {
        delete addBookSessions[userId];
        return safeReply(ctx, `✅ መጽሐፍት በ \`${category}\` ውስጥ እንደገና ተደራጅተዋል።\n\n👨‍💻 የቦቱ አዘጋጅ ዲያቆን ማቴዎስ ጌታሁን`, { parse_mode: 'Markdown' });
      } else {
        return safeReply(ctx, `❌ እንደገና ማደራጀት አልተሳካም። እባክዎትን እንደገና ይሞክሩ።`);
      }
    }

    delete addBookSessions[userId];
    return safeReply(ctx, "❌ ስራው ተበላሽቷል። እባክዎትን እንደገና ይጀምሩ።");
  }

  // ---- SKIP COMMANDS & BUTTON TEXTS ----
  if (text.startsWith('/')) return;

  // ---- SEARCH (typo-tolerant, cache-backed — no per-message DB fan-out) ----
  const query = text.trim().toLowerCase();
  const searchWords = query.split(' ').filter(w => w.length > 0).map(canonicalizeWord);
  if (searchWords.length === 0) return;

  const allBooks = await getAllBooksFlat();
  let matches = [];

  for (const book of allBooks) {
    if (!book.title) continue;
    const title = book.title.toLowerCase();
    const titleWords = title.split(' ').filter(w => w.length > 0).map(canonicalizeWord);
    if (titleWords.length === 0) continue;

    let isMatch = false;
    for (const sWord of searchWords) {
      for (const tWord of titleWords) {
        if (tWord.includes(sWord) || sWord.includes(tWord)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) break;
    }
    if (isMatch) matches.push(book);
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
    return safeReply(ctx, `🔍 ለ "${text}" ምንም ውጤት አልተገኘም።\n\n💡 እባክዎትን የመጽሐፉን ስም በትክክል ይጻፉ።`);
  }

  const shown = matches.slice(0, SEARCH_RESULTS_LIMIT);
  const buttons = shown.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.id}`)
  ]);
  const headerText = matches.length > SEARCH_RESULTS_LIMIT
    ? `🔍 ${matches.length} ውጤቶች (የመጀመሪያዎቹ ${SEARCH_RESULTS_LIMIT} እየታዩ ነው):`
    : `🔍 ${matches.length} ውጤቶች:`;
  safeReply(ctx, headerText, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 26. LAUNCH (with data loading)
// ==========================================
async function launchBot() {
  if (supabase) {
    console.log('📥 Loading data from Supabase...');
    await loadUsersFromSupabase();
    await loadBookStatsFromSupabase();
    await loadPendingReceiptsFromSupabase();
  }
  // Build the in-memory books cache once at startup (used by every hot path).
  await refreshAllBooksCache();

  try {
    await bot.launch({ dropPendingUpdates: true });
    console.log("✅ Bot is running...");
    console.log("📚 Orthodox Spiritual Books Bot is ready!");
    console.log("👑 Admin IDs:", ADMIN_IDS);
    let total = 0;
    for (const cat of allCategories) {
      const books = await getBooks(cat);
      total += books.length;
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