const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const http = require('http');

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const ADMIN_ID = 7480368503;
const ADMIN_USERNAME = "@Sealilenemariyammsle12we19";
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);

// In-Memory Database
const db = {
  users: {}, // user_id: { username, is_paid, registration_date, last_page_read }
  pendingReceipts: {} // message_id: user_id
};

// ==========================================
// 2. 24/7 UPTIME KEEP-ALIVE SERVER (EXPRESS)
// ==========================================
const app = express();

app.get('/health', (req, res) => res.status(200).send('OK - Bot is Alive'));
app.get('/ping', (req, res) => res.status(200).send('Pong'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// የ3 ደቂቃ Ping ሎጂክ (Render እንዳይተኛ)
setInterval(() => {
  const serverUrl = process.env.RENDER_EXTERNAL_URL;
  if (serverUrl) {
    const fetch = require('node-fetch');
    fetch(`${serverUrl}/ping`).catch(err => console.log('Ping failed:', err.message));
  }
}, 3 * 60 * 1000);

// ==========================================
// 3. BOOKS DATABASE (5 Sample Books Per Category)
// ==========================================
const booksDatabase = {
  // --- 3.1. በግዕዝ ---
  "geez_law": [
    { id: "DUMMY_GEEZ_LAW_01", title: "ርትዐ ነገሥት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_LAW_02", title: "ፍትሐ ነገሥት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_LAW_03", title: "ሥርዓተ ቤተ ክርስቲያን (ግዕዝ)" },
    { id: "DUMMY_GEEZ_LAW_04", title: "መጽሐፈ ዲደስቅልያ (ግዕዝ)" },
    { id: "DUMMY_GEEZ_LAW_05", title: "ቃኖናዊ መጻሕፍት (ግዕዝ)" }
  ],
  "geez_hist": [
    { id: "DUMMY_GEEZ_HIST_01", title: "ዜና አይሁድ (ግዕዝ)" },
    { id: "DUMMY_GEEZ_HIST_02", title: "መጽሐፈ አክሱም (ግዕዝ)" },
    { id: "DUMMY_GEEZ_HIST_03", title: "ታሪከ ነገሥት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_HIST_04", title: "ዜና እስክንድር (ግዕዝ)" },
    { id: "DUMMY_GEEZ_HIST_05", title: "መጽሐፈ ሱባኤ (ግዕዝ)" }
  ],
  "geez_gdsl": [
    { id: "DUMMY_GEEZ_GDSL_01", title: "ድርሳነ ሚካኤል (ግዕዝ)" },
    { id: "DUMMY_GEEZ_GDSL_02", title: "ድርሳነ ገብርኤል (ግዕዝ)" },
    { id: "DUMMY_GEEZ_GDSL_03", title: "ተአምረ ማርያም (ግዕዝ)" },
    { id: "DUMMY_GEEZ_GDSL_04", title: "ገድለ ተክለ ሃይማኖት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_GDSL_05", title: "ገድለ ጊዮርጊስ (ግዕዝ)" }
  ],
  "geez_ot": [
    { id: "DUMMY_GEEZ_OT_01", title: "ኦሪት ዘፍጥረት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_OT_02", title: "ኦሪት ዘጸአት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_OT_03", title: "መጽሐፈ መዝሙር (ግዕዝ)" },
    { id: "DUMMY_GEEZ_OT_04", title: "መጽሐፈ ኢሳይያስ (ግዕዝ)" },
    { id: "DUMMY_GEEZ_OT_05", title: "መጽሐፈ ምሳሌ (ግዕዝ)" }
  ],
  "geez_nt": [
    { id: "DUMMY_GEEZ_NT_01", title: "ወንጌል ዘማቴዎስ (ግዕዝ)" },
    { id: "DUMMY_GEEZ_NT_02", title: "ወንጌል ዘዮሐንስ (ግዕዝ)" },
    { id: "DUMMY_GEEZ_NT_03", title: "ግብረ ሐዋርያት (ግዕዝ)" },
    { id: "DUMMY_GEEZ_NT_04", title: "መልእክተ ጳውሎስ (ግዕዝ)" },
    { id: "DUMMY_GEEZ_NT_05", title: "ራእየ ዮሐንስ (ግዕዝ)" }
  ],

  // --- 3.2. በግዕዝ አማርኛ ---
  "ga_law": [
    { id: "DUMMY_GA_LAW_01", title: "ፍትሐ ነገሥት ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_LAW_02", title: "ሥርዓተ ቤተ ክርስቲያን ትርጓሜ" },
    { id: "DUMMY_GA_LAW_03", title: "መጽሐፈ ዲደስቅልያ ትርጓሜ" },
    { id: "DUMMY_GA_LAW_04", title: "ቃኖና ቤተ ክርስቲያን" },
    { id: "DUMMY_GA_LAW_05", title: "መጽሐፈ ቅዳሴ ንባቡና ትርጓሜው" }
  ],
  "ga_hist": [
    { id: "DUMMY_GA_HIST_01", title: "ዜና አይሁድ ትርጓሜ" },
    { id: "DUMMY_GA_HIST_02", title: "መጽሐፈ አክሱም ትርጓሜ" },
    { id: "DUMMY_GA_HIST_03", title: "ታሪከ ነገሥት ዘኢትዮጵያ" },
    { id: "DUMMY_GA_HIST_04", title: "ዜና እስክንድር ትርጓሜ" },
    { id: "DUMMY_GA_HIST_05", title: "መጽሐፈ ሱባኤ ትርጓሜ" }
  ],
  "ga_gdsl": [
    { id: "DUMMY_GA_GDSL_01", title: "ድርሳነ ሚካኤል ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_GDSL_02", title: "ድርሳነ ገብርኤል ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_GDSL_03", title: "ተአምረ ማርያም ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_GDSL_04", title: "ገድለ ተክለ ሃይማኖት ትርጓሜ" },
    { id: "DUMMY_GA_GDSL_05", title: "ገድለ ጊዮርጊስ ትርጓሜ" }
  ],
  "ga_ot": [
    { id: "DUMMY_GA_OT_01", title: "ኦሪት ዘፍጥረት ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_OT_02", title: "ኦሪት ዘጸአት ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_OT_03", title: "መዝሙረ ዳዊት ንባቡና ትርጓሜው" },
    { id: "DUMMY_GA_OT_04", title: "መጽሐፈ ኢሳይያስ ትርጓሜ" },
    { id: "DUMMY_GA_OT_05", title: "መጽሐፈ ምሳሌ ትርጓሜ" }
  ],
  "ga_nt": [
    { id: "DUMMY_GA_NT_01", title: "ወንጌል ዘማቴዎስ ትርጓሜ" },
    { id: "DUMMY_GA_NT_02", title: "ወንጌል ዘዮሐንስ ትርጓሜ" },
    { id: "DUMMY_GA_NT_03", title: "ግብረ ሐዋርያት ትርጓሜ" },
    { id: "DUMMY_GA_NT_04", title: "መልእክተ ጳውሎስ ትርጓሜ" },
    { id: "DUMMY_GA_NT_05", title: "ራእየ ዮሐንስ ትርጓሜ" }
  ],

  // --- 3.3. የግዕዝ ቋንቋ መማሪያ ---
  "geez_edu": [
    { id: "DUMMY_GEEZ_EDU_01", title: "የግዕዝ ቋንቋ መማሪያ መጽሐፍ" },
    { id: "DUMMY_GEEZ_EDU_02", title: "የሰዋስው ወሰወሰ ግዕዝ" },
    { id: "DUMMY_GEEZ_EDU_03", title: "መዝገበ ቃላት ግዕዝ-አማርኛ" },
    { id: "DUMMY_GEEZ_EDU_04", title: "የግዕዝ ግሥ መጽሐፍ" },
    { id: "DUMMY_GEEZ_EDU_05", title: "መጽሐፈ ሰዋስው ዘግዕዝ" }
  ],

  // --- 3.4. በአማርኛ ---
  "amh_law": [
    { id: "DUMMY_AMH_LAW_01", title: "የቤተ ክርስቲያን ሕግና ሥርዓት" },
    { id: "DUMMY_AMH_LAW_02", title: "የሥርዓተ ቅዳሴ ማብራሪያ" },
    { id: "DUMMY_AMH_LAW_03", title: "የክርስቲያን ജീവിതና ሥርዓት" },
    { id: "DUMMY_AMH_LAW_04", title: "የፍትሐ ነገሥት ማብራሪያ" },
    { id: "DUMMY_AMH_LAW_05", title: "የቅዱሳት ምስጢራት ሥርዓት" }
  ],
  "amh_hist": [
    { id: "DUMMY_AMH_HIST_01", title: "የኢትዮጵያ ቤተ ክርስቲያን ታሪክ" },
    { id: "DUMMY_AMH_HIST_02", title: "የዓለም ቤተ ክርስቲያን ታሪክ" },
    { id: "DUMMY_AMH_HIST_03", title: "የታሪከ ነገሥት ማጠቃለያ" },
    { id: "DUMMY_AMH_HIST_04", title: "የቅዱሳን አበው ታሪክ" },
    { id: "DUMMY_AMH_HIST_05", title: "የዜና መዋዕል ታሪክ" }
  ],
  "amh_gdsl": [
    { id: "DUMMY_AMH_GDSL_01", title: "ድርሳነ ሚካኤል በአማርኛ" },
    { id: "DUMMY_AMH_GDSL_02", title: "ድርሳነ ገብርኤል በአማርኛ" },
    { id: "DUMMY_AMH_GDSL_03", title: "ተአምረ ማርያም በአማርኛ" },
    { id: "DUMMY_AMH_GDSL_04", title: "ገድለ ተክለ ሃይማኖት በአማርኛ" },
    { id: "DUMMY_AMH_GDSL_05", title: "ገድለ ጊዮርጊስ በአማርኛ" }
  ],
  "amh_eth": [
    { id: "DUMMY_AMH_ETH_01", title: "ክርስቲያናዊ ሥነ ምግባር" },
    { id: "DUMMY_AMH_ETH_02", title: "የሕይወት ጎዳና" },
    { id: "DUMMY_AMH_ETH_03", title: "የበጎ አድራጎት ትምህርት" },
    { id: "DUMMY_AMH_ETH_04", title: "የትህትናና የፍቅር ሕይወት" },
    { id: "DUMMY_AMH_ETH_05", title: "የቤተሰብ ክርስቲያናዊ መመሪያ" }
  ],
  "amh_ot": [
    { id: "DUMMY_AMH_OT_01", title: "ኦሪት ዘፍጥረት በአማርኛ" },
    { id: "DUMMY_AMH_OT_02", title: "ኦሪት ዘጸአት በአማርኛ" },
    { id: "DUMMY_AMH_OT_03", title: "መዝሙረ ዳዊት በአማርኛ" },
    { id: "DUMMY_AMH_OT_04", title: "መጽሐፈ ኢሳይያስ በአማርኛ" },
    { id: "DUMMY_AMH_OT_05", title: "መጽሐፈ ምሳሌ በአማርኛ" }
  ],
  "amh_nt": [
    { id: "DUMMY_AMH_NT_01", title: "የቅዱስ ማቴዎስ ወንጌል" },
    { id: "DUMMY_AMH_NT_02", title: "የቅዱስ ዮሐንስ ወንጌል" },
    { id: "DUMMY_AMH_NT_03", title: "የሐዋርያት ሥራ" },
    { id: "DUMMY_AMH_NT_04", title: "የቅዱስ ጳውሎስ መልእክት" },
    { id: "DUMMY_AMH_NT_05", title: "የቅዱስ ዮሐንስ ራእይ" }
  ],
  "amh_std": [
    { id: "DUMMY_AMH_STD_01", title: "የመጽሐፍ ቅዱስ ጥናት መመሪያ" },
    { id: "DUMMY_AMH_STD_02", title: "የመጽሐፍ ቅዱስ መዝገበ ቃላት" },
    { id: "DUMMY_AMH_STD_03", title: "የብሉይ ኪዳን ጥናት" },
    { id: "DUMMY_AMH_STD_04", title: "የአዲስ ኪዳን ጥናት" },
    { id: "DUMMY_AMH_STD_05", title: "የትንቢት መጻሕፍት ጥናት" }
  ],
  "amh_chr": [
    { id: "DUMMY_AMH_CHR_01", title: "ነገረ ክርስቶስ ትምህርት 1" },
    { id: "DUMMY_AMH_CHR_02", title: "ነገረ ክርስቶስ ትምህርት 2" },
    { id: "DUMMY_AMH_CHR_03", title: "ነገረ ክርስቶስ ትምህርት 3" },
    { id: "DUMMY_AMH_CHR_04", title: "ነገረ ክርስቶስ ትምህርት 4" },
    { id: "DUMMY_AMH_CHR_05", title: "ነገረ ክርስቶስ ትምህርት 5" }
  ],
  "amh_mry": [
    { id: "DUMMY_AMH_MRY_01", title: "ነገረ ማርያም ትምህርት 1" },
    { id: "DUMMY_AMH_MRY_02", title: "ነገረ ማርያም ትምህርት 2" },
    { id: "DUMMY_AMH_MRY_03", title: "ነገረ ማርያም ትምህርት 3" },
    { id: "DUMMY_AMH_MRY_04", title: "ነገረ ማርያም ትምህርት 4" },
    { id: "DUMMY_AMH_MRY_05", title: "ነገረ ማርያም ትምህርት 5" }
  ],
  "amh_snt": [
    { id: "DUMMY_AMH_SNT_01", title: "ነገረ ቅዱሳን ትምህርት 1" },
    { id: "DUMMY_AMH_SNT_02", title: "ነገረ ቅዱሳን ትምህርት 2" },
    { id: "DUMMY_AMH_SNT_03", title: "ነገረ ቅዱሳን ትምህርት 3" },
    { id: "DUMMY_AMH_SNT_04", title: "ነገረ ቅዱሳን ትምህርት 4" },
    { id: "DUMMY_AMH_SNT_05", title: "ነገረ ቅዱሳን ትምህርት 5" }
  ],
  "amh_thl": [
    { id: "DUMMY_AMH_THL_01", title: "የሃይማኖት መሠረት 1" },
    { id: "DUMMY_AMH_THL_02", title: "የሃይማኖት መሠረት 2" },
    { id: "DUMMY_AMH_THL_03", title: "የሃይማኖት መሠረት 3" },
    { id: "DUMMY_AMH_THL_04", title: "የሃይማኖት መሠረት 4" },
    { id: "DUMMY_AMH_THL_05", title: "የሃይማኖት መሠረት 5" }
  ],

  // --- 3.5. በእንግሊዝ (English) ---
  "eng_law": [
    { id: "DUMMY_ENG_LAW_01", title: "Fetha Nagast (English)" },
    { id: "DUMMY_ENG_LAW_02", title: "Canon Law of Orthodox Church" },
    { id: "DUMMY_ENG_LAW_03", title: "The Didascalia (English)" },
    { id: "DUMMY_ENG_LAW_04", title: "Liturgy and Order" },
    { id: "DUMMY_ENG_LAW_05", title: "Ecclesiastical Canons" }
  ],
  "eng_hist": [
    { id: "DUMMY_ENG_HIST_01", title: "History of Ethiopian Church" },
    { id: "DUMMY_ENG_HIST_02", title: "Kebra Nagast (English)" },
    { id: "DUMMY_ENG_HIST_03", title: "Lives of Ethiopian Saints" },
    { id: "DUMMY_ENG_HIST_04", title: "Chronicles of Kings" },
    { id: "DUMMY_ENG_HIST_05", title: "Ancient Aksum History" }
  ],
  "eng_eth": [
    { id: "DUMMY_ENG_ETH_01", title: "Orthodox Christian Ethics" },
    { id: "DUMMY_ENG_ETH_02", title: "Path to Holiness" },
    { id: "DUMMY_ENG_ETH_03", title: "Spiritual Discipline" },
    { id: "DUMMY_ENG_ETH_04", title: "Christian Virtues" },
    { id: "DUMMY_ENG_ETH_05", title: "Family and Faith" }
  ],
  "eng_ot": [
    { id: "DUMMY_ENG_OT_01", title: "Book of Genesis (English)" },
    { id: "DUMMY_ENG_OT_02", title: "Book of Exodus (English)" },
    { id: "DUMMY_ENG_OT_03", title: "Psalms of David" },
    { id: "DUMMY_ENG_OT_04", title: "Book of Enoch" },
    { id: "DUMMY_ENG_OT_05", title: "Book of Jubilees" }
  ],
  "eng_thl": [
    { id: "DUMMY_ENG_THL_01", title: "Orthodox Theology Basics" },
    { id: "DUMMY_ENG_THL_02", title: "Mariology in Tradition" },
    { id: "DUMMY_ENG_THL_03", title: "Christology Principles" },
    { id: "DUMMY_ENG_THL_04", title: "The Holy Sacraments" },
    { id: "DUMMY_ENG_THL_05", title: "Dogmatic Theology" }
  ]
};

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
function isPaidUser(userId) {
  if (userId === ADMIN_ID) return true; // Admin Bypass Logic
  return db.users[userId] && db.users[userId].is_paid === true;
}

function registerUser(from) {
  if (!db.users[from.id]) {
    db.users[from.id] = {
      username: from.username ? `@${from.username}` : "No Username",
      is_paid: false,
      registration_date: new Date().toISOString(),
      last_page_read: 0
    };
  }
}

const mainKeyboard = Markup.keyboard([
  ['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ'],
  ['📞 Contact Me', '💬 Feedback'],
  ['🔄 Start']
]).resize();

// ==========================================
// 5. COMMANDS & MAIN MENU LOGIC
// ==========================================
bot.start((ctx) => {
  registerUser(ctx.from);
  ctx.reply(
    "እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት በሰላም መጡ",
    mainKeyboard
  );
});

bot.hears('🔄 Start', (ctx) => {
  ctx.reply("እንኳን ወደ ታላቁ የዲጂታል መጽሐፍ ቦት በሰላም መጡ", mainKeyboard);
});

bot.hears('📞 Contact Me', (ctx) => {
  ctx.reply(`📞 ለተጨማሪ መረጃ እና ግንኙነት፦\n\n• Telegram: ${ADMIN_USERNAME}\n• Email: matewosgetahunseifu@gmail.com`);
});

bot.hears('💬 Feedback', (ctx) => {
  ctx.reply(`💬 አስተያየትዎን ያድርሱን፦\n\nለማንኛውም ጥያቄ፣ አስተያየት ወይም ተጨማሪ መጽሐፍ ጥቆማ በቴሌግራም አድራሻችን ያግኙን፦\n\n• Telegram: ${ADMIN_USERNAME}\n• Email: matewosgetahunseifu@gmail.com`);
});

bot.hears('📚 መጽሐፍት', (ctx) => {
  ctx.reply(
    "እባኮን በምን ቋንቋ መጽሐፍ ማንበብ ይፈልጋሉ?",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("በግዕዝ", "lang_geez"),
        Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")
      ],
      [
        Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")
      ],
      [
        Markup.button.callback("በአማርኛ", "lang_amh"),
        Markup.button.callback("In English", "lang_eng")
      ]
    ])
  );
});

// ==========================================
// 6. CATEGORY ROUTING & CALLBACK HANDLERS
// ==========================================

// --- በግዕዝ ---
bot.action("lang_geez", (ctx) => {
  ctx.editMessageText(
    "በግዕዝ ቋንቋ የትኛውን የመጽሐፍ ምድብ ማንበብ ይፈልጋሉ?",
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
    "በግዕዝ ቋንቋ ከታሪክና ድርሳናት የሚፈልጉትን ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_geez_hist")],
      [Markup.button.callback("ገድል ተአምር እና ድርሳን", "cat_geez_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_geez")]
    ])
  );
});

bot.action("sub_geez_bible", (ctx) => {
  ctx.editMessageText(
    "በግዕዝ ቋንቋ ማንበብ የሚፈልጉትን የመጽሐፍ ምድብ ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("የብሉይ ኪዳን መጻሕፍት", "cat_geez_ot")],
      [Markup.button.callback("የሐዲስ ኪዳን መጻሕፍት", "cat_geez_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_geez")]
    ])
  );
});

// --- በግዕዝ አማርኛ ---
bot.action("lang_ga", (ctx) => {
  ctx.editMessageText(
    "በግዕዝ አማርኛ ቋንቋ ማንበብ የሚፈልጉትን የመጽሐፍ ምድብ ይምረጡ",
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
    "በግዕዝ አማርኛ ከታሪክና ድርሳናት ማንበብ የሚፈልጉትን ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_ga_hist")],
      [Markup.button.callback("ገድል ተአምር እና ድርሳን", "cat_ga_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
});

bot.action("sub_ga_bible", (ctx) => {
  ctx.editMessageText(
    "በግዕዝ አማርኛ ማንበብ የሚፈልጉትን ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("የብሉይ ኪዳን መጻሕፍት", "cat_ga_ot")],
      [Markup.button.callback("የአዲስ ኪዳን መጻሕፍት", "cat_ga_nt")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_ga")]
    ])
  );
});

// --- በአማርኛ ---
bot.action("lang_amh", (ctx) => {
  ctx.editMessageText(
    "በአማርኛ ቋንቋ ማንበብ የሚፈልጉትን የመጽሐፍ ምድብ ይምረጡ",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት ", "cat_amh_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_amh_hist")],
      [Markup.button.callback("ክርስቲያናዊ ሥነምግባር ", "cat_amh_eth")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_amh_bible")],
      [Markup.button.callback("ነገረ ሃይማኖት", "sub_amh_theology")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
});

bot.action("sub_amh_hist", (ctx) => {
  ctx.editMessageText(
    "በአማርኛ ከታሪክና ድርሳናት የሚፈልጉትን ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("ታሪክ", "cat_amh_hist")],
      [Markup.button.callback("ድርሳን ተአምር ገድላት", "cat_amh_gdsl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
});

bot.action("sub_amh_bible", (ctx) => {
  ctx.editMessageText(
    "በአማርኛ ከመጽሐፍ ቅዱስ ክፍል የሚፈልጉትን ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("የብሉይ ኪዳን መጽሐፍት", "cat_amh_ot")],
      [Markup.button.callback("የአዲስ ኪዳን መጽሐፍት", "cat_amh_nt")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ጥናት", "cat_amh_std")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
});

bot.action("sub_amh_theology", (ctx) => {
  ctx.editMessageText(
    "በአማርኛ ከነገረ ሃይማኖት ክፍል የሚፈልጉትን ይምረጡ፦",
    Markup.inlineKeyboard([
      [Markup.button.callback("ነገረ ክርስቶስ", "cat_amh_chr")],
      [Markup.button.callback("ነገረ ማርያም ወድኅነት", "cat_amh_mry")],
      [Markup.button.callback("ነገረ ቅዱሳን", "cat_amh_snt")],
      [Markup.button.callback("ነገረ ሃይማኖት", "cat_amh_thl")],
      [Markup.button.callback("⬅️ ተመለስ", "lang_amh")]
    ])
  );
});

// --- በእንግሊዝ (English) ---
bot.action("lang_eng", (ctx) => {
  ctx.editMessageText(
    "Please select a category in English:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Law & Order", "cat_eng_law")],
      [Markup.button.callback("History & Discourse", "cat_eng_hist")],
      [Markup.button.callback("Christian Ethics", "cat_eng_eth")],
      [Markup.button.callback("Bible Study & Passages", "cat_eng_ot")],
      [Markup.button.callback("Theology & Dogma", "cat_eng_thl")],
      [Markup.button.callback("⬅️ Back / ተመለስ", "back_to_lang")]
    ])
  );
});

// Back to Language Selection
bot.action("back_to_lang", (ctx) => {
  ctx.editMessageText(
    "እባኮን በምን ቋንቋ መጽሐፍ ማንበብ ይፈልጋሉ?",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("በግዕዝ", "lang_geez"),
        Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")
      ],
      [
        Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")
      ],
      [
        Markup.button.callback("በአማርኛ", "lang_amh"),
        Markup.button.callback("By English ", "lang_eng")
      ]
    ])
  );
});

// Dynamic Display of Category Books
bot.action(/^cat_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const books = booksDatabase[catKey];

  if (!books || books.length === 0) {
    return ctx.answerCbQuery("በዚህ ምድብ ምንም መጽሐፍ አልተገኘም።", { show_alert: true });
  }

  const buttons = books.map(book => [
    Markup.button.callback(`📖 ${book.title}`, `getbook_${book.id}`)
  ]);
  
  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);

  ctx.editMessageText("ማንበብ የሚፈልጉትን መጽሐፍ ይምረጡ፦", Markup.inlineKeyboard(buttons));
});

// ==========================================
// 7. BOOK DELIVERY & MONETIZATION LOGIC
// ==========================================
bot.action(/^getbook_(.+)$/, (ctx) => {
  const fileId = ctx.match[1];
  const userId = ctx.from.id;

  // Unpaid User Check
  if (!isPaidUser(userId)) {
    return ctx.reply(
      `የኦርቶዶክስ መንፈሳዊ መጽሐፍት\n\nሁሉንም የመጽሐፍ ዓይነቶች (በግዕዝ፣ በአማርኛ፣ በግዕዝ አማርኛ፣ የግዕዝ ቋንቋ) ሙሉ በሙሉ ለመጠቀም 200 (ሁለት መቶ) ብር አንድ ጊዜ ብቻ ይክፈሉ።\n\n💳 የክፍያ መንገዶች፦\n• አሐዱ ባንክ፦ 0100775011101\n• የኢትዮጵያ ንግድ ባንክ (CBE)፦ 1000661046841\n• አቢሲንያ ባንክ፦ 57080698\n• ቴሌብር (Telebirr)፦ 0943910036\n\n👤 የአካውንት ስም፦ Matewos Getahun Seifu\n\nክፍያ እንደፈጸሙ የባንክ ሪሲት (Receipt Photo/Document) ወደዚህ ቦት ይላኩ።`,
      Markup.inlineKeyboard([
        [Markup.button.callback("👁 ቅምሻ / Preview", `preview_${fileId}`)]
      ])
    );
  }

  // Content Protection (protect_content = True)
  ctx.replyWithDocument(fileId, {
    caption: "መልካም ንባብ! (ይህ መጽሐፍ የመጠበቅ መብቱ የተጠበቀ ስለሆነ ማስተላለፍ (Forward) አይቻልም)",
    protect_content: true
  }).catch(() => {
    ctx.reply(`📖 የመጽሐፉ Dummy ID: ${fileId}\n(በእውነተኛ ሰርቨር ላይ ፋይሉ ይላካል)`);
  });
});

// Preview / Sample Logic (Unpaid Users)
bot.action(/^preview_(.+)$/, (ctx) => {
  const fileId = ctx.match[1];
  ctx.reply(`📄 የመጽሐፉ ቅምሻ (Preview - የመጀመሪያዎቹ 2-3 ገጾች)፦\n\nይህ የናሙና ገጽ ነው [File ID: ${fileId}]። ሙሉውን መጽሐፍ ለማንበብ እባክዎን ክፍያውን ይፈጽሙ።`, {
    protect_content: true
  });
});

// ==========================================
// 8. AUTOMATED RECEIPT FILTERING & PROCESSING
// ==========================================
bot.on(['photo', 'document'], async (ctx, next) => {
  const userId = ctx.from.id;

  // አድሚን ከሆነ አዲስ መጽሐፍ አፕሎድ ማድረጊያ ሎጂክ ይሰራል።
  if (userId === ADMIN_ID) {
    return next();
  }

  // ቀደም ሲል የከፈለ ተጠቃሚ ከሆነ
  if (isPaidUser(userId)) {
    return ctx.reply("እርስዎ ቀደም ሲል ክፍያ ፈጽመው በሙሉ አቅም በመጠቀም ላይ ይገኛሉ።");
  }

  const caption = ctx.message.caption || "";
  const fileName = ctx.message.document ? ctx.message.document.file_name : "";
  const fullText = (caption + " " + fileName).toLowerCase();

  /* 
     የባንክ ሪሲት መሆናቸውን የሚያረጋግጡ ቁልፍ ቃላት (Keywords)
  */
  const validBankKeywords = [
    "cbe", "telebirr", "abyssinia", "ahadu", "bank", 
    "transaction", "ref", "receipt", "transfer", "etb", 
    "ብር", "ሒሳብ", "ማረጋገጫ", "matewos", "ማቴዎስ", "pdf", "image"
  ];

  // ፎቶ ወይም ዶክመንት ሲላክ ሪሲት መሆኑን በቴክስት/Caption/FileName ማረጋገጥ
  const isValidReceipt = validBankKeywords.some(keyword => fullText.includes(keyword)) || ctx.message.photo;

  // 1. የባንክ ሪሲት ካልሆነ ፎቶውን ዲሊት አድርጎ ማስጠንቀቂያ መስጠት
  if (!isValidReceipt) {
    ctx.deleteMessage().catch(() => {});
    return ctx.reply("⚠️ እባክዎን ትክክለኛ የከፈሉበትን የባንክ ሪሲት ብቻ ይላኩ!");
  }

  // 2. ሪሲት ከሆነ ቀጥታ ወደ አድሚን ማስተላለፍ
  const forwardedMsg = await ctx.telegram.forwardMessage(
    ADMIN_ID,
    ctx.chat.id,
    ctx.message.message_id
  );

  db.pendingReceipts[forwardedMsg.message_id] = userId;

  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `📥 አዲስ የክፍያ ሪሲት ደርሷል!\n\n👤 ተጠቃሚ ID: ${userId}\n👤 Username: @${ctx.from.username || 'የለውም'}`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ Approve", `approve_${userId}`),
        Markup.button.callback("❌ Reject", `reject_${userId}`)
      ]
    ])
  );

  ctx.reply("የላኩት ሪሲት ደርሶናል፤ አድሚኑ መርምሮ በጥቂት ደቂቃዎች ውስጥ አገልግሎቱን ይከፍትልዎታል!");
});

// Admin Approval/Rejection Actions
bot.action(/^approve_(\d+)$/, (ctx) => {
  const targetUserId = parseInt(ctx.match[1]);

  if (!db.users[targetUserId]) {
    db.users[targetUserId] = { is_paid: true };
  } else {
    db.users[targetUserId].is_paid = true;
  }

  ctx.telegram.sendMessage(
    targetUserId,
    "ክፍያዎ በትክክል ተቀባይነት አግኝቷል፤ ከአሁን በኋላ ሁሉንም መጽሐፍት ማውረድና መጠቀም ይችላሉ።"
  );

  ctx.editMessageText(`✅ የ ተጠቃሚ ${targetUserId} ክፍያ ጸድቋል።`);
});

bot.action(/^reject_(\d+)$/, (ctx) => {
  const targetUserId = parseInt(ctx.match[1]);

  ctx.telegram.sendMessage(
    targetUserId,
    "የላኩት ሪሲት ውድቅ ተደርጓል። እባክዎን ትክክለኛ ያልተደገመ ሪሲት ይላኩ።"
  );

  ctx.editMessageText(`❌ የ ተጠቃሚ ${targetUserId} ሪሲት ውድቅ ተደርጓል።`);
});

// ==========================================
// 9. SEARCH LOGIC ( Exact & Typo Match )
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  ctx.reply("እባክዎን ማንበብ የሚፈልጉትን የመጽሐፍ ስም ወይም ቁልፍ ቃል ያስገቡ፦");
});

bot.on('text', (ctx) => {
  const text = ctx.message.text;

  // Ignore main menu and admin commands in text search
  if (['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ', '📞 Contact Me', '💬 Feedback', '🔄 Start'].includes(text) || text.startsWith('/')) {
    return;
  }

  const query = text.trim().toLowerCase();
  let matches = [];

  // Flatten database search
  Object.keys(booksDatabase).forEach(cat => {
    booksDatabase[cat].forEach(book => {
      if (book.title.toLowerCase().includes(query)) {
        matches.push(book);
      }
    });
  });

  if (matches.length === 0) {
    return ctx.reply("ምንም የተዛመደ መጽሐፍ አልተገኘም። እባክዎን የቃሉን አጻጻፍ አስተካክለው ድጋሚ ይሞክሩ።");
  }

  const buttons = matches.map(book => [
    Markup.button.callback(`📖 ${book.title}`, `getbook_${book.id}`)
  ]);

  ctx.reply(`🔍 የፍለጋ ውጤቶች (${matches.length} ተገኝተዋል)፦`, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 10. ADMIN DASHBOARD & COMMANDS
// ==========================================
bot.command('admin', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  ctx.reply(
    "👨‍💻 እንኳን ወደ አድሚን ዳሽቦርድ በሰላም መጡ",
    Markup.inlineKeyboard([
      [Markup.button.callback("📊 ስታቲስቲክስ (/stats)", "admin_stats")],
      [Markup.button.callback("📢 ብሮድካስት (/broadcast)", "admin_broadcast_help")]
    ])
  );
});

bot.command('stats', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const totalUsers = Object.keys(db.users).length;
  const paidUsers = Object.values(db.users).filter(u => u.is_paid).length;
  const freeUsers = totalUsers - paidUsers;

  ctx.reply(`📊 የአጠቃቀም ስታቲስቲክስ፦\n\n• ጠቅላላ ተጠቃሚዎች፦ ${totalUsers}\n• ክፍያ የፈጸሙ፦ ${paidUsers}\n• ነፃ ተጠቃሚዎች፦ ${freeUsers}`);
});

bot.action('admin_stats', (ctx) => {
  const totalUsers = Object.keys(db.users).length;
  const paidUsers = Object.values(db.users).filter(u => u.is_paid).length;
  const freeUsers = totalUsers - paidUsers;

  ctx.editMessageText(`📊 የአጠቃቀም ስታቲስቲክስ፦\n\n• ጠቅላላ ተጠቃሚዎች፦ ${totalUsers}\n• ክፍያ የፈጸሙ፦ ${paidUsers}\n• ነፃ ተጠቃሚዎች፦ ${freeUsers}`);
});

// Broadcast Command
bot.command('broadcast', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) {
    return ctx.reply("እባክዎን የሚላከውን መልእክት አያይዘው ያስገቡ።\nምሳሌ፦ `/broadcast አዲስ መጽሐፍ ተጨምሯል!`");
  }

  const userIds = Object.keys(db.users);
  let count = 0;

  userIds.forEach(id => {
    ctx.telegram.sendMessage(id, `📢 ማስታወቂያ፦\n\n${message}`).then(() => {
      ctx.telegram.pinChatMessage(id, message.id).catch(() => {});
    }).catch(() => {});
    count++;
  });

  ctx.reply(`መልእክቱ ለ ${count} ተጠቃሚዎች ተልኳል።`);
});

bot.command('backup', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const backupData = JSON.stringify(db, null, 2);
  ctx.replyWithDocument({
    source: Buffer.from(backupData, 'utf-8'),
    filename: `database_backup_${Date.now()}.json`
  }, { caption: "📦 የዳታቤዝ ባካፕ ፋይል" });
});

// Admin Document Upload (Auto-Loop Add Book)
bot.on('document', async (ctx, next) => {
  if (ctx.from.id !== ADMIN_ID) return next();

  const fileId = ctx.message.document.file_id;
  const fileName = ctx.message.document.file_name;

  ctx.reply(`📥 አዲስ ፋይል ደርሷል።\n\nFile ID: \`${fileId}\`\nFile Name: ${fileName}\n\nይህንን ፋይል ወደ ዳታቤዝ ለማስገባት በኮዱ ውስጥ 'booksDatabase' ላይ ያካቱት።`, {
    parse_mode: 'Markdown'
  });
});

// ==========================================
// 11. BOT LAUNCH & ERROR HANDLING
// ==========================================
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
});

bot.launch().then(() => {
  console.log("Bot is running successfully...");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));