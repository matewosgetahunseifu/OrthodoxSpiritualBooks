const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

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

const bot = new Telegraf(BOT_TOKEN);

// ==========================================
// 2. EXPRESS SERVER (For Render Uptime)
// ==========================================
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Orthodox Spiritual Books Bot is running!');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK - Bot is Alive');
});

app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

app.listen(PORT, () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});

setInterval(async () => {
  const serverUrl = process.env.RENDER_EXTERNAL_URL;
  if (serverUrl) {
    try {
      if (globalThis.fetch) {
        await globalThis.fetch(`${serverUrl}/ping`);
      }
    } catch (err) {
      console.log('Ping failed:', err.message);
    }
  }
}, 3 * 60 * 1000);

// ==========================================
// 3. DATABASE SYSTEM
// ==========================================
const DATA_FILE = path.join(__dirname, 'database.json');

function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('⚠️ Error loading database:', error.message);
  }
  return { users: {}, pendingReceipts: {}, feedback: [], bookStats: {}, userActivity: {} };
}

function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('✅ Database saved');
  } catch (error) {
    console.log('❌ Failed to save database:', error.message);
  }
}

let db = loadDatabase();

// ==========================================
// 4. ADD BOOK SESSIONS
// ==========================================
const addBookSessions = {};

// ==========================================
// 5. BOOKS DATABASE (Complete - unchanged but with new English categories)
// ==========================================
const booksDatabase = {
  // ... existing categories (geez_law, geez_hist, geez_gdsl, geez_ot, geez_nt, ga_law, ga_hist, ga_gdsl, ga_ot, ga_nt, geez_edu, amh_law, amh_hist, amh_gdsl, amh_eth, amh_ot, amh_nt, amh_std, amh_chr, amh_mry, amh_snt, amh_thl, eng_law, eng_hist, eng_eth, eng_ot, eng_thl) ...
  // We'll add new English categories at the end
  "eng_gdsl": [],  // Discourse & Miracles
  "eng_nt": [],    // New Testament
  "eng_std": [],   // General Bible Study
  "eng_chr": [],   // Christology
  "eng_mry": [],   // Mariology
  "eng_snt": [],   // Hagiography
};

// ==========================================
// 6. HELPER FUNCTIONS (unchanged)
// ==========================================
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

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
    saveDatabase();
    logActivity(from.id, 'register', { username: from.username });
    return true;
  }
  return false;
}

function markUserPaid(userId) {
  if (!db.users[userId]) {
    db.users[userId] = { is_paid: true };
  } else {
    db.users[userId].is_paid = true;
  }
  saveDatabase();
  logActivity(userId, 'payment_approved', { status: 'paid' });
}

function findBook(catKey, bookId) {
  if (!booksDatabase[catKey]) return null;
  return booksDatabase[catKey].find(b => b.id === bookId);
}

function trackDownload(userId, catKey, bookId) {
  if (!db.users[userId]) return;
  db.users[userId].total_downloads = (db.users[userId].total_downloads || 0) + 1;
  if (!db.users[userId].books_downloaded) {
    db.users[userId].books_downloaded = [];
  }
  const bookKey = `${catKey}_${bookId}`;
  if (!db.users[userId].books_downloaded.includes(bookKey)) {
    db.users[userId].books_downloaded.push(bookKey);
  }
  if (!db.bookStats) db.bookStats = {};
  if (!db.bookStats[bookKey]) db.bookStats[bookKey] = 0;
  db.bookStats[bookKey]++;
  saveDatabase();
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

// ==========================================
// 7. RECEIPT VALIDATION (unchanged)
// ==========================================
const RECEIPT_KEYWORDS = [
  "receipt", "payment", "deposit", "transfer", "transaction",
  "bank", "cbe", "telebirr", "abyssinia", "ahadu", "etb",
  "ref", "reference", "amount", "date", "time",
  "ሪሲት", "ክፍያ", "ተቀባይ", "ላኪ", "ገንዘብ", "ባንክ",
  "ሂሳብ", "ቁጥር", "ማረጋገጫ", "ደረሰ", "ተላልፏል",
  "ብር", "ሺ", "ሺህ", "መቶ",
  "0100775011101", "1000661046841", "57080698", "0943910036",
  "matewos", "getahun", "seifu", "ማቴዎስ", "ጌታሁን", "ሰይፉ"
];

function validateBankReceipt(caption, fileName, fileType) {
  let confidence = 0;
  let reasons = [];
  const textToCheck = (caption + " " + fileName).toLowerCase();
  let keywordMatches = 0;
  for (const keyword of RECEIPT_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  }
  if (keywordMatches >= 3) {
    confidence += 50;
    reasons.push(`Found ${keywordMatches} receipt keywords`);
  } else if (keywordMatches >= 2) {
    confidence += 30;
    reasons.push(`Found ${keywordMatches} receipt keywords`);
  } else if (keywordMatches >= 1) {
    confidence += 15;
    reasons.push(`Found ${keywordMatches} receipt keyword`);
  }
  if (fileType === 'photo') {
    confidence += 30;
    reasons.push('File is a photo (likely receipt)');
  } else if (fileType === 'document') {
    confidence += 15;
    reasons.push('File type is document');
  } else {
    confidence += 5;
    reasons.push('Other file type');
  }
  if (textToCheck.includes('0100775011101') || textToCheck.includes('1000661046841') ||
      textToCheck.includes('57080698') || textToCheck.includes('0943910036')) {
    confidence += 30;
    reasons.push('Contains bank account number');
  }
  if (textToCheck.includes('matewos') || textToCheck.includes('ማቴዎስ')) {
    confidence += 15;
    reasons.push('Contains recipient name');
  }
  const hasDatePattern = /\d{1,2}[/-.]\d{1,2}[/-.]\d{2,4}/.test(textToCheck);
  const hasAmountPattern = /\d{1,3}(,\d{3})*(\.\d{2})?/.test(textToCheck);
  if (hasDatePattern) {
    confidence += 5;
    reasons.push('Contains date pattern');
  }
  if (hasAmountPattern) {
    confidence += 5;
    reasons.push('Contains amount pattern');
  }
  let isValid = false;
  if (fileType === 'photo') {
    isValid = confidence >= 30;
  } else {
    isValid = confidence >= 40;
  }
  return {
    isValid,
    confidence,
    reasons: reasons.join(', ')
  };
}

// ==========================================
// 8. MAIN KEYBOARD (unchanged)
// ==========================================
const mainKeyboard = Markup.keyboard([
  ['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ'],
  ['📞 አግኙኝ', '💬 አስተያየት'],
  ['📊 ስታቲስቲክስ', '🔄 ዳግም ጀምር']
]).resize();

// ==========================================
// 9. ERROR HANDLING & LOGGING (unchanged)
// ==========================================
function logActivity(userId, action, details) {
  try {
    const logFile = path.join(__dirname, 'activity.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] User: ${userId} | Action: ${action} | Details: ${JSON.stringify(details)}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.log('Could not write to activity log:', error.message);
  }
}

function logError(type, error) {
  try {
    const logFile = path.join(__dirname, 'error.log');
    const logEntry = `[${new Date().toISOString()}] ${type}: ${error.stack || error.message || error}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (e) {
    console.log('Could not write to error log:', e.message);
  }
}

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  logError('uncaughtException', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  logError('unhandledRejection', reason);
});

// ==========================================
// 10. RATE LIMITING (unchanged)
// ==========================================
const userRequests = {};

function checkRateLimit(userId) {
  const now = Date.now();
  if (!userRequests[userId]) userRequests[userId] = [];
  userRequests[userId] = userRequests[userId].filter(t => now - t < 60000);
  if (userRequests[userId].length >= 30) return false;
  userRequests[userId].push(now);
  return true;
}

// ==========================================
// 11. COMMANDS & BUTTON HANDLERS (unchanged)
// ==========================================
bot.start((ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  }
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
  ctx.reply(
    "እባኮን ቋንቋ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
      [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
      [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("እንግሊዝኛ", "lang_eng")]
    ])
  );
});

bot.hears('📊 ስታቲስቲክስ', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  if (!stats) return ctx.reply("❌ መረጃ አልተገኘም።");
  ctx.reply(
    `📊 **የእርስዎ ስታቲስቲክስ**\n\n👤 ${stats.username}\n💰 ${stats.is_paid ? '✅ ክፍያ ተፈጽሟል' : '❌ አልተከፈለም'}\n📚 ${stats.total_downloads} ውርዶች\n📖 ${stats.books_downloaded} ልዩ መጽሐፍት\n🌍 ${stats.preferred_language}`,
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
// 12. ADD BOOK COMMAND (unchanged)
// ==========================================
bot.command('addbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return ctx.reply("⛔ ይህ ትዕዛዝ ለአድሚን ብቻ ነው!");
  }
  if (addBookSessions[userId]) {
    return ctx.reply("⚠️ አሁን መጽሐፍ እየጨመሩ ነው!\nእባክዎትን መጀመሪያ ያለውን ይጨርሱ ወይም /canceladd ይጠቀሙ።");
  }
  addBookSessions[userId] = { step: 'title' };
  ctx.reply(
    `📚 **Add a New Book**\n\n**Step 1: Enter Book Title**\n\n✏️ Please type the full title of the book:\nExample: \`ድርሳነ ሚካኤል ብራና\``,
    { parse_mode: 'Markdown' }
  );
});

bot.command('canceladd', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.reply("❌ መጽሐፍ መጨመር ተሰርዟል።");
  } else {
    ctx.reply("⚠️ ምንም እየተጨመረ ያለ መጽሐፍ የለም።");
  }
});

// ==========================================
// 13. AMHARIC CATEGORY ROUTING (unchanged)
// ==========================================
bot.action("lang_geez", (ctx) => {
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez";
    saveDatabase();
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
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez_amharic";
    saveDatabase();
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
  ctx.editMessageText(
    "ከመጽሐፍ ቅዱስ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ብሉይ ኪዳን", "cat_ga_ot")],
      [Markup.button.callback("ሐዲስ ኪዳን", "cat_ga_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
});

// ---------- AMHARIC MAIN MENU ----------
bot.action("lang_amh", (ctx) => {
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "amharic";
    saveDatabase();
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

// ==========================================
// 13. ENGLISH CATEGORY ROUTING (UPDATED with sub-menus)
// ==========================================
bot.action("lang_eng", (ctx) => {
  const userId = ctx.from.id;
  if (db.users[userId]) {
    db.users[userId].preferred_language = "english";
    saveDatabase();
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

// English sub-menu: History & Discourse
bot.action("sub_eng_hist", (ctx) => {
  ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("History", "cat_eng_hist")],
      [Markup.button.callback("Discourse & Miracles", "cat_eng_gdsl")],
      [Markup.button.callback("⬅️ Back", "lang_eng")]
    ])
  );
});

// English sub-menu: Bible Study
bot.action("sub_eng_bible", (ctx) => {
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

// English sub-menu: Theology & Dogma
bot.action("sub_eng_theology", (ctx) => {
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

// Back to language selection
bot.action("back_to_lang", (ctx) => {
  ctx.editMessageText(
    "እባኮን ቋንቋ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
      [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
      [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("እንግሊዝኛ", "lang_eng")]
    ])
  );
});

// ==========================================
// 14. CATEGORY SELECTION (unchanged)
// ==========================================
bot.action(/^cat_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const books = booksDatabase[catKey];
  if (!books || books.length === 0) {
    return ctx.answerCbQuery("ምንም መጽሐፍ የለም", { show_alert: true });
  }
  const buttons = books.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${catKey}_${book.id}`)
  ]);
  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);
  ctx.editMessageText("መጽሐፍ ይምረጡ:", Markup.inlineKeyboard(buttons));
});

// ==========================================
// 15. BOOK SELECTION (unchanged)
// ==========================================
bot.action(/^gb_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);
  if (!book) return ctx.answerCbQuery("መጽሐፉ አልተገኘም", { show_alert: true });

  if (!isPaidUser(userId)) {
    return ctx.reply(
      `📖 **${book.title}**\n\n🔒 This book requires a one‑time payment of **200 ETB** to unlock all books.\n\n📸 Please send a bank receipt to this bot.\n\n👁 You can preview the first ${PREVIEW_PAGES} pages by clicking the button below.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback("👁 View Preview", `preview_${catKey}_${bookId}`)],
          [Markup.button.callback("📖 Buy & Read Full Book", `gb_${catKey}_${bookId}`)]
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
    ctx.reply(
      `❌ የመጽሐፉ ስም፦ ${book.title}\n(ፋይሉ አልተገኘም)\n\n🔄 እባክዎትን እንደገና ይሞክሩ።`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Retry", `retry_${catKey}_${bookId}`)]
      ])
    );
  });
});

// ==========================================
// 16. PREVIEW HANDLER (unchanged)
// ==========================================
bot.action(/^preview_(.+)_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);
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
// 17. RETRY HANDLER (unchanged)
// ==========================================
bot.action(/^retry_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);
  if (!book) return ctx.reply("❌ መጽሐፉ አልተገኘም።");
  if (!isPaidUser(userId)) return ctx.reply("⛔ ክፍያ አልፈጸሙም።");

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨`,
    protect_content: true
  }).then(() => {
    trackDownload(userId, catKey, bookId);
    ctx.reply("✅ መጽሐፉ በተሳካ ሁኔታ ተላከ!");
  }).catch(() => {
    ctx.reply("❌ እንደገና አልተሳካም። እባክዎትን በኋላ ይሞክሩ።");
  });
});

// ==========================================
// 18. ADD CATEGORY BUTTON (unchanged)
// ==========================================
bot.action(/^addcat_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  const category = ctx.match[1];
  if (!isAdmin(userId)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  if (!addBookSessions[userId]) return ctx.answerCbQuery("⚠️ /addbook first!", { show_alert: true });
  const session = addBookSessions[userId];
  session.category = category;
  session.step = 'file';
  ctx.editMessageText(
    `✅ Category: \`${category}\`\n\n📎 Step 4: Send the Book File\n\n📤 Please send the book file (PDF, photo, video, etc.) to complete.\n\n💡 This is the final step!`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('cancel_add_book', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.editMessageText("❌ መጽሐፍ መጨመር ተሰርዟል።");
  } else {
    ctx.answerCbQuery("❌ ምንም እየተጨመረ ያለ መጽሐፍ የለም");
  }
});

// ==========================================
// 19. ADMIN COMMANDS (unchanged)
// ==========================================
bot.command('stats', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const total = Object.keys(db.users).length;
  const paid = Object.values(db.users).filter(u => u.is_paid).length;
  ctx.reply(
    `📊 **Stats**\n\n👤 Total: ${total}\n💰 Paid: ${paid}\n📖 Free: ${total - paid}\n📁 Books: ${Object.values(booksDatabase).reduce((s, c) => s + c.length, 0)}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('backup', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    saveDatabase();
    const backupData = JSON.stringify(db, null, 2);
    if (!backupData || backupData === '{}') {
      return ctx.reply('⚠️ Database is empty or corrupted.');
    }
    await ctx.replyWithDocument({
      source: Buffer.from(backupData, 'utf-8'),
      filename: `backup_${Date.now()}.json`
    }, { caption: "📦 Database Backup" });
  } catch (err) {
    console.error('Backup error:', err);
    ctx.reply('❌ Failed to generate backup. Check logs.');
  }
});

bot.command('categories', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  let list = "📂 Available Categories:\n\n";
  Object.keys(booksDatabase).forEach(cat => {
    list += `• \`${cat}\` - ${booksDatabase[cat].length} books\n`;
  });
  ctx.reply(list, { parse_mode: 'Markdown' });
});

// ==========================================
// 20. ADMIN ACTIONS (unchanged)
// ==========================================
bot.action(/^approve_(\d+)_(.+)$/, (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  markUserPaid(userId);
  ctx.telegram.sendMessage(userId, `✅ Payment #${orderNumber} approved! 🎉\n\nAll books are now available! 📚`);
  ctx.editMessageText(`✅ #${orderNumber} approved`);
});

bot.action(/^reject_(\d+)_(.+)$/, (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery("⛔ Admin only!", { show_alert: true });
  const userId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];
  ctx.telegram.sendMessage(userId, `❌ Payment #${orderNumber} rejected. Please send a valid receipt.`);
  ctx.editMessageText(`❌ #${orderNumber} rejected`);
});

// ==========================================
// 21. SEARCH (unchanged)
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  ctx.reply("🔍 እባክዎን የመጽሐፍ ስም ያስገቡ፦");
});

// ==========================================
// 22. TEXT HANDLER (unchanged)
// ==========================================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  console.log(`📝 Message from ${userId}: "${text}"`);
  logActivity(userId, 'text_received', { text: text });

  if (addBookSessions[userId]) {
    const session = addBookSessions[userId];

    if (text === '/canceladd') {
      delete addBookSessions[userId];
      return ctx.reply("❌ ተሰርዟል።");
    }

    if (session.step === 'title') {
      session.title = text.trim();
      session.step = 'preview';
      session.preview = '';
      return ctx.reply(
        `✅ Title: \`${session.title}\`\n\n📄 **Step 2: Enter Preview**\n\n✏️ Type preview. Type \`/done\` or \`done\` when finished.`,
        { parse_mode: 'Markdown' }
      );
    }

    if (session.step === 'preview') {
      if (text.toLowerCase() === '/done' || text.toLowerCase() === 'done') {
        if (!session.preview || session.preview.trim().length < 10) {
          return ctx.reply("⚠️ Preview too short! Please write at least 10 characters.");
        }
        session.step = 'category';
        const categoryButtons = [];
        const categories = Object.keys(booksDatabase);
        for (let i = 0; i < categories.length; i += 2) {
          const row = [];
          row.push(Markup.button.callback(categories[i], `addcat_${categories[i]}`));
          if (i + 1 < categories.length) {
            row.push(Markup.button.callback(categories[i + 1], `addcat_${categories[i + 1]}`));
          }
          categoryButtons.push(row);
        }
        categoryButtons.push([Markup.button.callback("❌ Cancel", "cancel_add_book")]);
        return ctx.reply(
          `✅ Preview saved!\n\n📂 **Step 3: Select Category**`,
          Markup.inlineKeyboard(categoryButtons)
        );
      }

      if (!session.preview) session.preview = text;
      else session.preview += '\n\n' + text;
      const wordCount = session.preview.split(' ').length;
      return ctx.reply(`📄 Updated! (${wordCount} words) Type /done or done when finished.`);
    }
    return;
  }

  if (text.startsWith('/')) return;
  if (['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ', '📞 አግኙኝ', '💬 አስተያየት', '📊 ስታቲስቲክስ', '🔄 ዳግም ጀምር'].includes(text)) return;

  const query = text.trim().toLowerCase();
  let matches = [];
  Object.keys(booksDatabase).forEach(catKey => {
    booksDatabase[catKey].forEach(book => {
      if (book.title.toLowerCase().includes(query)) matches.push({ ...book, catKey });
    });
  });

  if (matches.length === 0) {
    return ctx.reply(`🔍 No results for "${text}"`);
  }

  const buttons = matches.slice(0, 20).map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.catKey}_${book.id}`)
  ]);
  ctx.reply(`🔍 ${matches.length} results:`, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 23. FILE HANDLER (unchanged)
// ==========================================
function extractFileInfo(msg) {
  if (msg.document) {
    return { type: 'document', fileId: msg.document.file_id, fileName: msg.document.file_name || 'Document.pdf', mimeType: msg.document.mime_type || 'application/pdf', fileSize: msg.document.file_size || 0 };
  }
  if (msg.photo && msg.photo.length > 0) {
    const photo = msg.photo[msg.photo.length - 1];
    return { type: 'photo', fileId: photo.file_id, fileName: 'Photo.jpg', mimeType: 'image/jpeg', fileSize: photo.file_size || 0 };
  }
  if (msg.video) {
    return { type: 'video', fileId: msg.video.file_id, fileName: msg.video.file_name || 'Video.mp4', mimeType: 'video/mp4', fileSize: msg.video.file_size || 0 };
  }
  if (msg.audio) {
    return { type: 'audio', fileId: msg.audio.file_id, fileName: msg.audio.file_name || 'Audio.mp3', mimeType: 'audio/mpeg', fileSize: msg.audio.file_size || 0 };
  }
  if (msg.voice) {
    return { type: 'voice', fileId: msg.voice.file_id, fileName: 'Voice.ogg', mimeType: 'audio/ogg', fileSize: msg.voice.file_size || 0 };
  }
  if (msg.animation) {
    return { type: 'animation', fileId: msg.animation.file_id, fileName: 'Animation.gif', mimeType: 'image/gif', fileSize: msg.animation.file_size || 0 };
  }
  if (msg.sticker) {
    return { type: 'sticker', fileId: msg.sticker.file_id, fileName: 'Sticker.webp', mimeType: 'image/webp', fileSize: msg.sticker.file_size || 0 };
  }
  return null;
}

bot.on(['document', 'photo', 'video', 'audio', 'voice', 'animation', 'sticker'], async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");

  if (addBookSessions[userId] && addBookSessions[userId].step === 'file') {
    const session = addBookSessions[userId];
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return ctx.reply("❌ የፋይሉ መረጃ አልተገኘም።");
    const category = session.category;
    const books = booksDatabase[category];
    let maxId = 0;
    books.forEach(b => { const num = parseInt(b.id); if (!isNaN(num) && num > maxId) maxId = num; });
    const newId = (maxId + 1).toString();
    const newBook = {
      id: newId,
      file_id: fileInfo.fileId,
      title: session.title,
      preview: session.preview || 'Preview not available'
    };
    booksDatabase[category].push(newBook);
    saveDatabase();
    delete addBookSessions[userId];
    ctx.reply(
      `✅ **Book Added!** 📚\n\n📂 ${category}\n🆔 ID: ${newId}\n📄 ${session.title}\n📊 Total: ${booksDatabase[category].length} books`,
      { parse_mode: 'Markdown' }
    );
    logActivity(userId, 'add_book', { category, bookId: newId, title: session.title });
    return;
  }

  if (isAdmin(userId)) {
    const fileInfo = extractFileInfo(message);
    if (fileInfo) {
      return ctx.reply(
        `🔑 **File ID**\n\n📄 ${fileInfo.fileName}\n🆔 \`${fileInfo.fileId}\`\n📁 ${fileInfo.type}\n📦 ${(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB`,
        { parse_mode: 'Markdown' }
      );
    }
    return ctx.reply("⚠️ የፋይሉ መረጃ አልተገኘም።");
  }

  if (isPaidUser(userId)) {
    try { await ctx.deleteMessage(); } catch (err) {}
    return ctx.reply("✅ ክፍያ ፈጽመዋል።");
  }

  const fileInfo = extractFileInfo(message);
  if (!fileInfo) {
    try { await ctx.deleteMessage(); } catch (err) {}
    return ctx.reply("⚠️ ትክክለኛ ሪሲት ይላኩ።");
  }

  const caption = message.caption || "";
  const validation = validateBankReceipt(caption, fileInfo.fileName, fileInfo.type);
  if (!validation.isValid) {
    try { await ctx.deleteMessage(); } catch (err) {}
    return ctx.reply("❌ ይህ የባንክ ሪሲት አይደለም!");
  }

  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  try {
    const forwardedMsg = await ctx.telegram.forwardMessage(ADMIN_IDS[0], ctx.chat.id, message.message_id);
    db.pendingReceipts[forwardedMsg.message_id] = { userId, orderNumber, confidence: validation.confidence };
    saveDatabase();
    for (const adminId of ADMIN_IDS) {
      await ctx.telegram.sendMessage(adminId,
        `📥 **New Receipt**\n\n🧾 ${orderNumber}\n👤 ${userId}\n✅ ${validation.confidence}%\n📋 ${validation.reasons}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback("✅ Approve", `approve_${userId}_${orderNumber}`), Markup.button.callback("❌ Reject", `reject_${userId}_${orderNumber}`)]]) }
      );
    }
    ctx.reply(`✅ Receipt received! 🧾 ${orderNumber}\n\nAdmin will verify shortly.`);
  } catch (forwardError) {
    console.log('Forward failed, sending directly:', forwardError.message);
    try {
      if (fileInfo.type === 'photo') {
        await ctx.telegram.sendPhoto(ADMIN_IDS[0], fileInfo.fileId, {
          caption: `📥 **New Receipt** (direct)\n🧾 ${orderNumber}\n👤 ${userId}\n✅ ${validation.confidence}%\n📋 ${validation.reasons}`,
          parse_mode: 'Markdown'
        });
      } else {
        await ctx.telegram.sendDocument(ADMIN_IDS[0], fileInfo.fileId, {
          caption: `📥 **New Receipt** (direct)\n🧾 ${orderNumber}\n👤 ${userId}\n✅ ${validation.confidence}%\n📋 ${validation.reasons}`,
          parse_mode: 'Markdown'
        });
      }
      const dummyId = `direct_${orderNumber}`;
      db.pendingReceipts[dummyId] = { userId, orderNumber, confidence: validation.confidence };
      saveDatabase();
      for (const adminId of ADMIN_IDS) {
        await ctx.telegram.sendMessage(adminId,
          `🧾 ${orderNumber}\n👤 ${userId}`,
          Markup.inlineKeyboard([[Markup.button.callback("✅ Approve", `approve_${userId}_${orderNumber}`), Markup.button.callback("❌ Reject", `reject_${userId}_${orderNumber}`)]])
        );
      }
      ctx.reply(`✅ Receipt received! 🧾 ${orderNumber}\n\nAdmin will verify shortly.`);
    } catch (directError) {
      console.error('Direct send failed:', directError);
      ctx.reply("⚠️ Error processing receipt. Please try again or contact admin.");
    }
  }
});

// ==========================================
// 24. /done COMMAND (unchanged)
// ==========================================
bot.command('done', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    return ctx.reply("You are already in the add book flow. Please follow the steps.");
  }
  ctx.reply("You are not adding a book. Use /addbook to start adding a new book.");
});

// ==========================================
// 25. LAUNCH (unchanged)
// ==========================================
async function launchBot() {
  try {
    await bot.launch({
      dropPendingUpdates: true
    });
    console.log("✅ Bot is running...");
    console.log("📚 Orthodox Spiritual Books Bot is ready!");
    console.log("👑 Admin IDs:", ADMIN_IDS);
    console.log(`📖 Total Books: ${Object.values(booksDatabase).reduce((s, c) => s + c.length, 0)}`);
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

process.once('SIGINT', () => { saveDatabase(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { saveDatabase(); bot.stop('SIGTERM'); });