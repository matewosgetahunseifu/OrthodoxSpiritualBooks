const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const ADMIN_ID = 7480368503;
const ADMIN_USERNAME = "@Sealilenemariyammsle12we19";
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const db = {
  users: {}, 
  pendingReceipts: {} 
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
// 3. BOOKS DATABASE
// ==========================================
const booksDatabase = {
  // --- 3.1. በግዕዝ ---
  "geez_law": [
    { id: "1", file_id: "DUMMY_GEEZ_LAW_01", title: "ርትዐ ነገሥት (ግዕዝ)" },
    { id: "2", file_id: "DUMMY_GEEZ_LAW_02", title: "ፍትሐ ነገሥት (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_LAW_03", title: "ሥርዓተ ቤተ ክርስቲያን (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_LAW_04", title: "መጽሐፈ ዲደስቅልያ (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_LAW_05", title: "ቃኖናዊ መጻሕፍት (ግዕዝ)" }
  ],
  "geez_hist": [
    { id: "1", file_id: "DUMMY_GEEZ_HIST_01", title: "ዜና አይሁድ (ግዕዝ)" },
    { id: "2", file_id: "DUMMY_GEEZ_HIST_02", title: "መጽሐፈ አክሱም (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_HIST_03", title: "ታሪከ ነገሥት (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_HIST_04", title: "ዜና እስክንድር (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_HIST_05", title: "መጽሐፈ ሱባኤ (ግዕዝ)" }
  ],
  "geez_gdsl": [
    { id: "1", file_id: "DUMMY_GEEZ_GDSL_01", title: "ድርሳነ ሚካኤል (ግዕዝ)" },
    { id: "2", file_id: "DUMMY_GEEZ_GDSL_02", title: "ድርሳነ ገብርኤል (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_GDSL_03", title: "ተአምረ ማርያም (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_GDSL_04", title: "ገድለ ተክለ ሃይማኖት (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_GDSL_05", title: "ገድለ ጊዮርጊስ (ግዕዝ)" }
  ],
  "geez_ot": [
    { id: "1", file_id: "BQACAgQAAxkBAAMYapd7UbkpzfZTIng9daYvw8A1q-4AAn0JAAIWA9hQw4UxsdCUEow9BA", title: "፭ቱ መጽሐፍተ ኦሪት ብራና ትርጓሜ " },
    { id: "2", file_id: "DUMMY_GEEZ_OT_02", title: "ኦሪት ዘጸአት (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_OT_03", title: "መጽሐፈ መዝሙር (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_OT_04", title: "መጽሐፈ ኢሳይያስ (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_OT_05", title: "መጽሐፈ ምሳሌ (ግዕዝ)" }
  ],
  "geez_nt": [
    { id: "1", file_id: "BQACAgQAAxkBAAMaapd8piiIyiFFa_-dYnnKkqU2RgcAAgMeAALIlMFT0Y7m-S1fk-I9BA", title: "ሙሉው ሐዲስ ኪዳን የጸዳ(ሚነበብ) ብራና" },
    { id: "2", file_id: "DUMMY_GEEZ_NT_02", title: "ወንጌል ዘዮሐንስ (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_NT_03", title: "ግብረ ሐዋርያት (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_NT_04", title: "መልእክተ ጳውሎስ (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_NT_05", title: "ራእየ ዮሐንስ (ግዕዝ)" }
  ],

  // --- 3.2. በግዕዝ አማርኛ ---
  "ga_law": [
    { id: "1", file_id: "DUMMY_GA_LAW_01", title: "ፍትሐ ነገሥት ንባቡና ትርጓሜው" },
    { id: "2", file_id: "DUMMY_GA_LAW_02", title: "ሥርዓተ ቤተ ክርስቲያን ትርጓሜ" },
    { id: "3", file_id: "DUMMY_GA_LAW_03", title: "መጽሐፈ ዲደስቅልያ ትርጓሜ" },
    { id: "4", file_id: "DUMMY_GA_LAW_04", title: "ቃኖና ቤተ ክርስቲያን" },
    { id: "5", file_id: "DUMMY_GA_LAW_05", title: "መጽሐፈ ቅዳሴ ንባቡና ትርጓሜው" }
  ],
  "ga_hist": [
    { id: "1", file_id: "DUMMY_GA_HIST_01", title: "ዜና አይሁድ ትርጓሜ" },
    { id: "2", file_id: "DUMMY_GA_HIST_02", title: "መጽሐፈ አክሱም ትርጓሜ" },
    { id: "3", file_id: "DUMMY_GA_HIST_03", title: "ታሪከ ነገሥት ዘኢትዮጵያ" },
    { id: "4", file_id: "DUMMY_GA_HIST_04", title: "ዜና እስክንድር ትርጓሜ" },
    { id: "5", file_id: "DUMMY_GA_HIST_05", title: "መጽሐፈ ሱባኤ ትርጓሜ" }
  ],
  "ga_gdsl": [
    { id: "1", file_id: "DUMMY_GA_GDSL_01", title: "ድርሳነ ሚካኤል ንባቡና ትርጓሜው" },
    { id: "2", file_id: "DUMMY_GA_GDSL_02", title: "ድርሳነ ገብርኤል ንባቡና ትርጓሜው" },
    { id: "3", file_id: "DUMMY_GA_GDSL_03", title: "ተአምረ ማርያም ንባቡና ትርጓሜው" },
    { id: "4", file_id: "DUMMY_GA_GDSL_04", title: "ገድለ ተክለ ሃይማኖት ትርጓሜ" },
    { id: "5", file_id: "DUMMY_GA_GDSL_05", title: "ገድለ ጊዮርጊስ ትርጓሜ" }
  ],
  "ga_ot": [
    { id: "1", file_id: "DUMMY_GA_OT_01", title: "ኦሪት ዘፍጥረት ንባቡና ትርጓሜው" },
    { id: "2", file_id: "DUMMY_GA_OT_02", title: "ኦሪት ዘጸአት ንባቡና ትርጓሜው" },
    { id: "3", file_id: "DUMMY_GA_OT_03", title: "መዝሙረ ዳዊት ንባቡና ትርጓሜው" },
    { id: "4", file_id: "DUMMY_GA_OT_04", title: "መጽሐፈ ኢሳይያስ ትርጓሜ" },
    { id: "5", file_id: "DUMMY_GA_OT_05", title: "መጽሐፈ ምሳሌ ትርጓሜ" }
  ],
  "ga_nt": [
    { id: "1", file_id: "BQACAgQAAxkBAAN0apersTfkSpLpXujQvxu4zFJ8MioAAmceAAK225lQA3vS59CEP0U9BA", title: "ወንጌል ዘማቴዎስ ትርጓሜ" },
    { id: "2", file_id: "BQACAgQAAxkBAAN0apersTfkSpLpXujQvxu4zFJ8MioAAmceAAK225lQA3vS59CEP0U9BA", title: "ወንጌል ዘማርቆስ ትርጓሜ" },
    { id: "3", file_id: "BQACAgQAAxkBAANyapersQ98wbYKC8-79MnvYLqhKTAAAmQeAAK225lQS9MwBsORgaI9BA", title: "ወንጌል ዘሉቃድ ትርጓሜ" },
    { id: "4", file_id: "BQACAgQAAxkBAANzapersT-LRq5gCg7KU_3K9e6EKmoAAhkbAAJt8rhSH2tfVI7_W4M9BA", title: "ወንጌል ዘዮሐንስ ትርጓሜ" },
    { id: "5", file_id: "DUMMY_GA_NT_05", title: "ራእየ ዮሐንስ ትርጓሜ" }
  ],

  // --- 3.3. የግዕዝ ቋንቋ መማሪያ ---
  "geez_edu": [
    { 
      id: "1", 
      file_id: "BQACAgQAAxkBAAMQapdxmNt2UHnzrQim-4cLtqskVeoAAqofAAI12zhQxSRCSEyXyN89BA", 
      title: "መጽሐፈ፡ሰዋስው፡ወግስ፡ወመዝገበ፡ቃላት፡ሐዲስ" 
    },
    { id: "2", file_id: "DUMMY_GEEZ_EDU_02", title: "የሰዋስው ወሰወሰ ግዕዝ" },
    { id: "3", file_id: "DUMMY_GEEZ_EDU_03", title: "መዝገበ ቃላት ግዕዝ-አማርኛ" },
    { id: "4", file_id: "DUMMY_GEEZ_EDU_04", title: "የግዕዝ ግሥ መጽሐፍ" },
    { id: "5", file_id: "DUMMY_GEEZ_EDU_05", title: "መጽሐፈ ሰዋስው ዘግዕዝ" }
  ],

  // --- 3.4. በአማርኛ ---
  "amh_law": [
    { id: "1", file_id: "DUMMY_AMH_LAW_01", title: "የቤተ ክርስቲያን ሕግና ሥርዓት" },
    { id: "2", file_id: "DUMMY_AMH_LAW_02", title: "የሥርዓተ ቅዳሴ ማብራሪያ" },
    { id: "3", file_id: "DUMMY_AMH_LAW_03", title: "የክርስቲያን ሕይወትና ሥርዓት" },
    { id: "4", file_id: "DUMMY_AMH_LAW_04", title: "የፍትሐ ነገሥት ማብራሪያ" },
    { id: "5", file_id: "DUMMY_AMH_LAW_05", title: "የቅዱሳት ምስጢራት ሥርዓት" }
  ],
  "amh_hist": [
    { id: "1", file_id: "DUMMY_AMH_HIST_01", title: "የኢትዮጵያ ቤተ ክርስቲያን ታሪክ" },
    { id: "2", file_id: "DUMMY_AMH_HIST_02", title: "የዓለም ቤተ ክርስቲያን ታሪክ" },
    { id: "3", file_id: "DUMMY_AMH_HIST_03", title: "የታሪከ ነገሥት ማጠቃለያ" },
    { id: "4", file_id: "DUMMY_AMH_HIST_04", title: "የቅዱሳን አበው ታሪክ" },
    { id: "5", file_id: "DUMMY_AMH_HIST_05", title: "የዜና መዋዕል ታሪክ" }
  ],
  "amh_gdsl": [
    { id: "1", file_id: "DUMMY_AMH_GDSL_01", title: "ድርሳነ ሚካኤል በአማርኛ" },
    { id: "2", file_id: "DUMMY_AMH_GDSL_02", title: "ድርሳነ ገብርኤል በአማርኛ" },
    { id: "3", file_id: "DUMMY_AMH_GDSL_03", title: "ተአምረ ማርያም በአማርኛ" },
    { id: "4", file_id: "DUMMY_AMH_GDSL_04", title: "ገድለ ተክለ ሃይማኖት በአማርኛ" },
    { id: "5", file_id: "DUMMY_AMH_GDSL_05", title: "ገድለ ጊዮርጊስ በአማርኛ" }
  ],
  "amh_eth": [
    { id: "1", file_id: "DUMMY_AMH_ETH_01", title: "ክርስቲያናዊ ሥነ ምግባር" },
    { id: "2", file_id: "DUMMY_AMH_ETH_02", title: "የሕይወት ጎዳና" },
    { id: "3", file_id: "DUMMY_AMH_ETH_03", title: "የበጎ አድራጎት ትምህርት" },
    { id: "4", file_id: "DUMMY_AMH_ETH_04", title: "የትህትናና የፍቅር ሕይወት" },
    { id: "5", file_id: "DUMMY_AMH_ETH_05", title: "የቤተሰብ ክርስቲያናዊ መመሪያ" }
  ],
  "amh_ot": [
    { id: "1", file_id: "DUMMY_AMH_OT_01", title: "ኦሪት ዘፍጥረት በአማርኛ" },
    { id: "2", file_id: "DUMMY_AMH_OT_02", title: "ኦሪት ዘጸአት በአማርኛ" },
    { id: "3", file_id: "DUMMY_AMH_OT_03", title: "መዝሙረ ዳዊት በአማርኛ" },
    { id: "4", file_id: "DUMMY_AMH_OT_04", title: "መጽሐፈ ኢሳይያስ በአማርኛ" },
    { id: "5", file_id: "DUMMY_AMH_OT_05", title: "መጽሐፈ ምሳሌ በአማርኛ" }
  ],
  "amh_nt": [
    { id: "1", file_id: "DUMMY_AMH_NT_01", title: "የቅዱስ ማቴዎስ ወንጌል" },
    { id: "2", file_id: "DUMMY_AMH_NT_02", title: "የቅዱስ ዮሐንስ ወንጌል" },
    { id: "3", file_id: "DUMMY_AMH_NT_03", title: "የሐዋርያት ሥራ" },
    { id: "4", file_id: "DUMMY_AMH_NT_04", title: "የቅዱስ ጳውሎስ መልእክት" },
    { id: "5", file_id: "DUMMY_AMH_NT_05", title: "የቅዱስ ዮሐንስ ራእይ" }
  ],
  "amh_std": [
    { id: "1", file_id: "DUMMY_AMH_STD_01", title: "የመጽሐፍ ቅዱስ ጥናት መመሪያ" },
    { id: "2", file_id: "DUMMY_AMH_STD_02", title: "የመጽሐፍ ቅዱስ መዝገበ ቃላት" },
    { id: "3", file_id: "DUMMY_AMH_STD_03", title: "የብሉይ ኪዳን ጥናት" },
    { id: "4", file_id: "DUMMY_AMH_STD_04", title: "የአዲስ ኪዳን ጥናት" },
    { id: "5", file_id: "DUMMY_AMH_STD_05", title: "የትንቢት መጻሕፍት ጥናት" }
  ],
  "amh_chr": [
    { id: "1", file_id: "BQACAgQAAxkBAAMuapeKeQL2zvehmKt3MO2gUxGVZvQAAmEZAAL-iRFSUPgwjQABaU7tPQQ", title: "ነገረ ክርስቶስ መ/ር በትረ ማርያም" },
    { id: "2", file_id: "BQACAgIAAxkBAAMtapeKNEeBt2v9bN9-QVFpLZtnPbAAArJbAAJlqAFJmPw18dc07Rw9BA", title: "በነገረ ክርስቶስ ላይ የተነሱ ጥያቄዎች እና መልሶቻቸው Dr ሮዳስ ታደሰ" },
    { id: "3", file_id: "DUMMY_AMH_CHR_03", title: "ነገረ ክርስቶስ ትምህርት 3" },
    { id: "4", file_id: "DUMMY_AMH_CHR_04", title: "ነገረ ክርስቶስ ትምህርት 4" },
    { id: "5", file_id: "DUMMY_AMH_CHR_05", title: "ነገረ ክርስቶስ ትምህርት 5" }
  ],
  "amh_mry": [
    { id: "1", file_id: "BQACAgQAAxkBAAMcapd9mbw5iHKJf-7Y1JPbLh2sGTMAAvEKAAIn8NhRpbFmUy6n4sw9BA", title: "ነገረ ማርያም በሐዲስ ኪዳን Dr ሮዳስ ታደሰ" },
    { id: "2", file_id: "DUMMY_AMH_MRY_02", title: "ነገረ ማርያም ትምህርት 2" },
    { id: "3", file_id: "DUMMY_AMH_MRY_03", title: "ነገረ ማርያም ትምህርት 3" },
    { id: "4", file_id: "DUMMY_AMH_MRY_04", title: "ነገረ ማርያም ትምህርት 4" },
    { id: "5", file_id: "DUMMY_AMH_MRY_05", title: "ነገረ ማርያም ትምህርት 5" }
  ],
  "amh_snt": [
    { id: "1", file_id: "DUMMY_AMH_SNT_01", title: "ነገረ ቅዱሳን ትምህርት 1" },
    { id: "2", file_id: "DUMMY_AMH_SNT_02", title: "ነገረ ቅዱሳን ትምህርት 2" },
    { id: "3", file_id: "DUMMY_AMH_SNT_03", title: "ነገረ ቅዱሳን ትምህርት 3" },
    { id: "4", file_id: "DUMMY_AMH_SNT_04", title: "ነገረ ቅዱሳን ትምህርት 4" },
    { id: "5", file_id: "DUMMY_AMH_SNT_05", title: "ነገረ ቅዱሳን ትምህርት 5" }
  ],
  "amh_thl": [
    { id: "1", file_id: "DUMMY_AMH_THL_01", title: "የሃይማኖት መሠረት 1" },
    { id: "2", file_id: "DUMMY_AMH_THL_02", title: "የሃይማኖት መሠረት 2" },
    { id: "3", file_id: "DUMMY_AMH_THL_03", title: "የሃይማኖት መሠረት 3" },
    { id: "4", file_id: "DUMMY_AMH_THL_04", title: "የሃይማኖት መሠረት 4" },
    { id: "5", file_id: "DUMMY_AMH_THL_05", title: "የሃይማኖት መሠረት 5" }
  ],

  // --- 3.5. In English ---
  "eng_law": [
    { id: "1", file_id: "DUMMY_ENG_LAW_01", title: "Fetha Nagast (English)" },
    { id: "2", file_id: "DUMMY_ENG_LAW_02", title: "Canon Law of Orthodox Church" },
    { id: "3", file_id: "DUMMY_ENG_LAW_03", title: "The Didascalia (English)" },
    { id: "4", file_id: "DUMMY_ENG_LAW_04", title: "Liturgy and Order" },
    { id: "5", file_id: "DUMMY_ENG_LAW_05", title: "Ecclesiastical Canons" }
  ],
  "eng_hist": [
    { id: "1", file_id: "DUMMY_ENG_HIST_01", title: "History of Ethiopian Church" },
    { id: "2", file_id: "DUMMY_ENG_HIST_02", title: "Kebra Nagast (English)" },
    { id: "3", file_id: "DUMMY_ENG_HIST_03", title: "Lives of Ethiopian Saints" },
    { id: "4", file_id: "DUMMY_ENG_HIST_04", title: "Chronicles of Kings" },
    { id: "5", file_id: "DUMMY_ENG_HIST_05", title: "Ancient Aksum History" }
  ],
  "eng_eth": [
    { id: "1", file_id: "DUMMY_ENG_ETH_01", title: "Orthodox Christian Ethics" },
    { id: "2", file_id: "DUMMY_ENG_ETH_02", title: "Path to Holiness" },
    { id: "3", file_id: "DUMMY_ENG_ETH_03", title: "Spiritual Discipline" },
    { id: "4", file_id: "DUMMY_ENG_ETH_04", title: "Christian Virtues" },
    { id: "5", file_id: "DUMMY_ENG_ETH_05", title: "Family and Faith" }
  ],
  "eng_ot": [
    { id: "1", file_id: "DUMMY_ENG_OT_01", title: "Book of Genesis (English)" },
    { id: "2", file_id: "DUMMY_ENG_OT_02", title: "Book of Exodus (English)" },
    { id: "3", file_id: "DUMMY_ENG_OT_03", title: "Psalms of David" },
    { id: "4", file_id: "DUMMY_ENG_OT_04", title: "Book of Enoch" },
    { id: "5", file_id: "DUMMY_ENG_OT_05", title: "Book of Jubilees" }
  ],
  "eng_thl": [
    { id: "1", file_id: "DUMMY_ENG_THL_01", title: "Orthodox Theology Basics" },
    { id: "2", file_id: "DUMMY_ENG_THL_02", title: "Mariology in Tradition" },
    { id: "3", file_id: "DUMMY_ENG_THL_03", title: "Christology Principles" },
    { id: "4", file_id: "DUMMY_ENG_THL_04", title: "The Holy Sacraments" },
    { id: "5", file_id: "DUMMY_ENG_THL_05", title: "Dogmatic Theology" }
  ]
};

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
function isPaidUser(userId) {
  if (userId === ADMIN_ID) return true;
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

function findBook(catKey, bookId) {
  if (!booksDatabase[catKey]) return null;
  return booksDatabase[catKey].find(b => b.id === bookId);
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
  ctx.reply("እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት በሰላም መጡ", mainKeyboard);
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

bot.action("lang_amh", (ctx) => {
  ctx.editMessageText(
    "በአማርኛ ቋንቋ ማንበብ የሚፈልጉትን የመጽሐፍ ምድብ ይምረጡ",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_amh_law")],
      [Markup.button.callback("ታሪክና ድርሳናት", "sub_amh_hist")],
      [Markup.button.callback("ክርስቲያናዊ ሥነ ምግባር", "cat_amh_eth")],
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
        Markup.button.callback("In English", "lang_eng")
      ]
    ])
  );
});

// ==========================================
// DYNAMIC DISPLAY OF CATEGORY BOOKS
// ==========================================
bot.action(/^cat_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const books = booksDatabase[catKey];

  if (!books || books.length === 0) {
    return ctx.answerCbQuery("በዚህ ምድብ ምንም መጽሐፍ አልተገኘም።", { show_alert: true });
  }

  const buttons = books.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${catKey}_${book.id}`)
  ]);

  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);

  ctx.editMessageText("ማንበብ የሚፈልጉትን መጽሐፍ ይምረጡ፦", Markup.inlineKeyboard(buttons));
});

// ==========================================
// 7. BOOK DELIVERY & MONETIZATION LOGIC
// ==========================================
bot.action(/^gb_(.+)_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const userId = ctx.from.id;

  const book = findBook(catKey, bookId);

  if (!book) {
    return ctx.answerCbQuery("መጽሐፉ አልተገኘም።", { show_alert: true });
  }

  if (!isPaidUser(userId)) {
    return ctx.reply(
      `የኦርቶዶክስ መንፈሳዊ መጽሐፍት\n\nሁሉንም የመጽሐፍ ዓይነቶች (በግዕዝ፣ በአማርኛ፣ በግዕዝ አማርኛ፣ የግዕዝ ቋንቋ) ሙሉ በሙሉ ለመጠቀም 200 (ሁለት መቶ) ብር አንድ ጊዜ ብቻ ይክፈሉ።\n\n💳 የክፍያ መንገዶች፦\n• አሐዱ ባንክ፦ 0100775011101\n• የኢትዮጵያ ንግድ ባንክ (CBE)፦ 1000661046841\n• አቢሲንያ ባንክ፦ 57080698\n• ቴሌብር (Telebirr)፦ 0943910036\n\n👤 የአካውንት ስም፦ Matewos Getahun Seifu\n\nክፍያ እንደፈጸሙ የባንክ ሪሲት (Receipt Photo/Document) ወደዚህ ቦት ይላኩ።`,
      Markup.inlineKeyboard([
        [Markup.button.callback("👁 ቅምሻ / Preview", `prev_${catKey}_${bookId}`)]
      ])
    );
  }

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! (ይህ መጽሐፍ የመጠበቅ መብቱ የተጠበቀ ስለሆነ ማስተላለፍ (Forward) አይቻልም)`,
    protect_content: true
  }).catch(() => {
    ctx.reply(`📖 የመጽሐፉ ስም፦ ${book.title}\n(ፋይሉ በቴሌግራም ላይ አልተገኘም ወይም File ID ስህተት ነው)`);
  });
});

bot.action(/^prev_(.+)_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);

  const title = book ? book.title : "መጽሐፍ";

  ctx.reply(`📄 የመጽሐፉ ቅምሻ (Preview - ${title})፦\n\nይህ የናሙና ገጽ ነው፤ ሙሉውን መጽሐፍ ለማንበብ እባክዎን ክፍያውን ይፈጽሙ።`, {
    protect_content: true
  });
});

// ==========================================
// 8. AUTOMATED FILE PROCESSING & RECEIPT FILTERING (FIXED FOR FORWARDED FILES)
// ==========================================
// This function deeply extracts file info from ANY message type
function extractFileInfo(msg) {
  console.log('Analyzing message:', JSON.stringify(msg, null, 2));
  
  // Check for document directly
  if (msg.document) {
    return {
      type: 'document',
      fileId: msg.document.file_id,
      fileName: msg.document.file_name || 'Document.pdf',
      mimeType: msg.document.mime_type || 'application/pdf',
      fileSize: msg.document.file_size || 0
    };
  }
  
  // Check for photo (get highest quality)
  if (msg.photo && msg.photo.length > 0) {
    const photo = msg.photo[msg.photo.length - 1];
    return {
      type: 'photo',
      fileId: photo.file_id,
      fileName: 'Photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: photo.file_size || 0
    };
  }
  
  // Check for video
  if (msg.video) {
    return {
      type: 'video',
      fileId: msg.video.file_id,
      fileName: 'Video.mp4',
      mimeType: 'video/mp4',
      fileSize: msg.video.file_size || 0
    };
  }
  
  // Check for audio
  if (msg.audio) {
    return {
      type: 'audio',
      fileId: msg.audio.file_id,
      fileName: msg.audio.file_name || 'Audio.mp3',
      mimeType: 'audio/mpeg',
      fileSize: msg.audio.file_size || 0
    };
  }
  
  // Check for voice
  if (msg.voice) {
    return {
      type: 'voice',
      fileId: msg.voice.file_id,
      fileName: 'Voice.ogg',
      mimeType: 'audio/ogg',
      fileSize: msg.voice.file_size || 0
    };
  }
  
  // Check for animation (GIF)
  if (msg.animation) {
    return {
      type: 'animation',
      fileId: msg.animation.file_id,
      fileName: 'Animation.gif',
      mimeType: 'image/gif',
      fileSize: msg.animation.file_size || 0
    };
  }
  
  // Check for sticker
  if (msg.sticker) {
    return {
      type: 'sticker',
      fileId: msg.sticker.file_id,
      fileName: 'Sticker.webp',
      mimeType: 'image/webp',
      fileSize: msg.sticker.file_size || 0
    };
  }
  
  // Check for forwarded message that might have file in media group
  // Telegram often sends media groups as separate messages with the same media_group_id
  // The file will be in the individual message
  if (msg.forward_from_chat || msg.forward_from) {
    // For forwarded messages, the file info might be in the original message
    // But we already checked document/photo above, so if we're here, there's no direct file
    console.log('Forwarded message with no direct file detected');
    return null;
  }
  
  console.log('No file found in message');
  return null;
}

bot.on(['photo', 'document', 'video', 'audio', 'voice', 'animation', 'sticker'], async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message;
  
  console.log(`Received ${message} from user ${userId}`);

  // Extract file info using the robust function
  const fileInfo = extractFileInfo(message);

  // If no file info found, inform the user
  if (!fileInfo) {
    return ctx.reply("⚠️ የፋይሉ መረጃ ሊገኝ አልቻለም። እባክዎን ፋይሉን በቀጥታ ይላኩ (Forward ሳያደርጉ)። ወይም ደግሞ ፋይሉን ከቻናል እያስተላለፉ ከሆነ በመጀመሪያ ፋይሉን ወደ እራስዎ አስቀምጠው ከዚያ ይላኩ።");
  }

  // ADMIN: Extract and display file ID for any file
  if (userId === ADMIN_ID) {
    return ctx.reply(
      `🔑 **የፋይሉ ID ተዘጋጅቷል (Admin Only)**\n\n` +
      `📄 **File Name:** \`${fileInfo.fileName}\`\n` +
      `🆔 **File ID:** \`${fileInfo.fileId}\`\n` +
      `📁 **File Type:** \`${fileInfo.type}\`\n` +
      `📋 **MIME Type:** \`${fileInfo.mimeType}\`\n` +
      `📦 **File Size:** \`${(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB\`\n\n` +
      `ይህንን File ID ኮፒ በማድረግ በ 'booksDatabase' ውስጥ በ 'file_id' ቦታ ማስገባት ይችላሉ።\n\n` +
      `📝 **ለመጠቀም መመሪያ:**\n` +
      `1. ከላይ ያለውን File ID ይቅዱ\n` +
      `2. በ booksDatabase ውስጥ ተገቢውን መጽሐፍ ይፈልጉ\n` +
      `3. የ 'file_id' እሴትን በተቀዳው ID ይቀይሩ`,
      { parse_mode: 'Markdown' }
    );
  }

  // For non-admin users: check if it's a valid receipt
  const caption = message.caption || "";
  const docName = fileInfo.fileName || "";
  const fullText = (caption + " " + docName).toLowerCase();

  const validBankKeywords = [
    "cbe", "telebirr", "abyssinia", "ahadu", "bank", 
    "transaction", "ref", "receipt", "transfer", "etb", 
    "ብር", "ሒሳብ", "ማረጋገጫ", "matewos", "ማቴዎስ", "pdf",
    "payment", "deposit", "ሪሲት", "receipt"
  ];

  const hasKeyword = validBankKeywords.some(keyword => fullText.includes(keyword));
  const isPhotoReceipt = fileInfo.type === 'photo';
  const isValidReceipt = hasKeyword || isPhotoReceipt;

  if (!isValidReceipt) {
    // Try to delete the message, but don't fail if we can't
    try {
      await ctx.deleteMessage();
    } catch (err) {
      console.log('Could not delete message:', err.message);
    }
    return ctx.reply("⚠️ እባክዎን ትክክለኛ የከፈሉበትን የባንክ ሪሲት (Receipt Photo/Document) ብቻ ይላኩ! ሌሎች ፋይሎች አይፈቀዱም።");
  }

  if (isPaidUser(userId)) {
    return ctx.reply("እርስዎ ቀደም ሲል ክፍያ ፈጽመው በሙሉ አቅም በመጠቀም ላይ ይገኛሉ። ተጨማሪ ሪሲት መላክ አያስፈልግዎትም።");
  }

  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    // Forward the message to admin (works for both direct and forwarded messages)
    const forwardedMsg = await ctx.telegram.forwardMessage(
      ADMIN_ID,
      ctx.chat.id,
      message.message_id
    );

    db.pendingReceipts[forwardedMsg.message_id] = {
      userId: userId,
      orderNumber: orderNumber
    };

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `📥 **አዲስ የክፍያ ሪሲት ደርሷል!**\n\n` +
      `🧾 **Order No:** \`#${orderNumber}\`\n` +
      `👤 **ተጠቃሚ ID:** \`${userId}\`\n` +
      `👤 **Username:** @${ctx.from.username || 'የለውም'}\n` +
      `📄 **File Name:** \`${fileInfo.fileName}\`\n` +
      `📁 **File Type:** \`${fileInfo.type}\`\n` +
      `📋 **MIME Type:** \`${fileInfo.mimeType}\`\n` +
      `📦 **File Size:** \`${(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Approve", `approve_${userId}_${orderNumber}`),
            Markup.button.callback("❌ Reject", `reject_${userId}_${orderNumber}`)
          ]
        ])
      }
    );

    ctx.reply(
      `✅ የላኩት ሪሲት ደርሶናል!\n\n` +
      `🧾 **የትዕዛዝ ቁጥርዎ (Order No):** \`#${orderNumber}\`\n\n` +
      `አድሚኑ መርምሮ በጥቂት ደቂቃዎች ውስጥ አገልግሎቱን ይከፍትልዎታል!`, 
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error processing receipt:', error);
    ctx.reply("⚠️ ሪሲትዎን ማስኬድ አልቻልኩም። እባክዎን በቀጥታ ወደ አድሚን ይላኩ።");
  }
});

bot.action(/^approve_(\d+)_(.+)$/, (ctx) => {
  const targetUserId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];

  if (!db.users[targetUserId]) {
    db.users[targetUserId] = { is_paid: true };
  } else {
    db.users[targetUserId].is_paid = true;
  }

  ctx.telegram.sendMessage(
    targetUserId,
    `✅ የትዕዛዝ ቁጥር #${orderNumber} ክፍያዎ በትክክል ተቀባይነት አግኝቷል! ከአሁን በኋላ ሁሉንም መጽሐፍት ማውረድና መጠቀም ይችላሉ።`
  );

  ctx.editMessageText(`✅ የ ተጠቃሚ ${targetUserId} ክፍያ (Order #${orderNumber}) ጸድቋል።`);
});

bot.action(/^reject_(\d+)_(.+)$/, (ctx) => {
  const targetUserId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];

  ctx.telegram.sendMessage(
    targetUserId,
    `❌ የትዕዛዝ ቁጥር #${orderNumber} ሪሲትዎ ውድቅ ተደርጓል። እባክዎን ትክክለኛ ያልተደገመ ሪሲት ይላኩ።`
  );

  ctx.editMessageText(`❌ የ ተጠቃሚ ${targetUserId} ሪሲት (Order #${orderNumber}) ውድቅ ተደርጓል።`);
});

// ==========================================
// 9. SEARCH LOGIC
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  ctx.reply("እባክዎን ማንበብ የሚፈልጉትን የመጽሐፍ ስም ወይም ቁልፍ ቃል ያስገቡ፦");
});

bot.on('text', (ctx) => {
  const text = ctx.message.text;

  if (['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ', '📞 Contact Me', '💬 Feedback', '🔄 Start'].includes(text) || text.startsWith('/')) {
    return;
  }

  const query = text.trim().toLowerCase();
  let matches = [];

  Object.keys(booksDatabase).forEach(catKey => {
    booksDatabase[catKey].forEach(book => {
      if (book.title.toLowerCase().includes(query)) {
        matches.push({ ...book, catKey });
      }
    });
  });

  if (matches.length === 0) {
    return ctx.reply("ምንም የተዛመደ መጽሐፍ አልተገኘም። እባክዎን የቃሉን አጻጻፍ አስተካክለው ድጋሚ ይሞክሩ።");
  }

  const buttons = matches.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.catKey}_${book.id}`)
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

// ==========================================
// 11. BOT LAUNCH & ERROR HANDLING
// ==========================================
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
});

bot.launch({
  dropPendingUpdates: true
}).then(() => {
  console.log("Bot is running successfully...");
}).catch((err) => {
  console.error("Failed to launch bot:", err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));