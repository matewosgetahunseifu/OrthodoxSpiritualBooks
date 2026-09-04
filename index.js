const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const ADMIN_IDS = [7480368503]; // Add multiple admin IDs here
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

// Health check routes
app.get('/', (req, res) => {
  res.send('✅ Orthodox Spiritual Books Bot is running!');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK - Bot is Alive');
});

app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});

// Self-ping to keep bot alive (for Render free tier)
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
// 5. BOOKS DATABASE
// ==========================================
const booksDatabase = {
  // --- 3.1. በግዕዝ ---
  "geez_law": [
    { id: "1", file_id: "DUMMY_GEEZ_LAW_01", title: "ርትዐ ነገሥት (ግዕዝ)", preview: "ይህ የርትዐ ነገሥት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GEEZ_LAW_02", title: "ፍትሐ ነገሥት (ግዕዝ)", preview: "ይህ የፍትሐ ነገሥት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GEEZ_LAW_03", title: "ሥርዓተ ቤተ ክርስቲያን (ግዕዝ)", preview: "ይህ የሥርዓተ ቤተ ክርስቲያን መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GEEZ_LAW_04", title: "መጽሐፈ ዲደስቅልያ (ግዕዝ)", preview: "ይህ የመጽሐፈ ዲደስቅልያ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GEEZ_LAW_05", title: "ቃኖናዊ መጻሕፍት (ግዕዝ)", preview: "ይህ የቃኖናዊ መጻሕፍት መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "geez_hist": [
    { id: "1", file_id: "DUMMY_GEEZ_HIST_01", title: "ዜና አይሁድ (ግዕዝ)", preview: "ይህ የዜና አይሁድ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GEEZ_HIST_02", title: "መጽሐፈ አክሱም (ግዕዝ)", preview: "ይህ የመጽሐፈ አክሱም መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GEEZ_HIST_03", title: "ታሪከ ነገሥት (ግዕዝ)", preview: "ይህ የታሪከ ነገሥት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GEEZ_HIST_04", title: "ዜና እስክንድር (ግዕዝ)", preview: "ይህ የዜና እስክንድር መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GEEZ_HIST_05", title: "መጽሐፈ ሱባኤ (ግዕዝ)", preview: "ይህ የመጽሐፈ ሱባኤ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "geez_gdsl": [
    { id: "1", file_id: "BQACAgQAAxkBAAPZapjWdXjCEeNoOjlRMK0G6pX6Bk0AAj8KAAL6HClRQKqGVFXiKK49BA", title: "ድርሳነ ሚካኤል ብራና", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሊቀ መላእክት ቅዱስ ሚካኤል..." },
    { id: "2", file_id: "BQACAgQAAxkBAAPfapjXcgpreKHIrBgNQGEua7HCmTkAAjwKAAJ9PIlTM8CfaZvR-2k9BA", title: "ድርሳነ ሰብዓቱ መላእክት", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሰብዓቱ ሊቃነ መላእክት..." },
    { id: "3", file_id: "BQACAgQAAxkBAAPhapjZBSJoVscB4rjwsfDWbSwHxoAAoEWAAIMhmhQkIh7mGtt3K09BA", title: "ድርሳነ ሊቀ መላእክት ቅዱስ ገብርኤል ብራና", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሊቀ መላእክት ቅዱስ ገብርኤል..." },
    { id: "4", file_id: "BQACAgQAAxkBAAPjapjZhdpHFvYDvcFIkczDUW9tLIAAlMdAAKS69FTbBiiXs-zys9BA", title: "የብራና ድርሳነ ሚካኤል በልሳነ ግእዝ", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሊቀ መላእክት ቅዱስ ሚካኤል በልሳነ ግእዝ..." },
    { id: "5", file_id: "BQACAgQAAxkBAAPqapjbmRP3A_QVTyhXBZWLS5TjLGoAAtgNAAJtwMBTHiiUSHg9EAY9BA", title: "ድርሳነ ሊቀ መላእክት ቅዱስ ገብርኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሊቀ መላእክት ቅዱስ ገብርኤል..." },
    { id: "6", file_id: "BQACAgQAAxkBAAIBDGqY_SozbC0I2Fi7ge5kQMckNxwqAAJ5FQACjWfpUmi2j5U2zN51PQQ", title: "ድርሳን ዘነገሮሙ እግዚእነ ለሐዋርያት", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳን ዘነገሮሙ እግዚእነ ለሐዋርያት..." },
    { id: "7", file_id: "BQACAgQAAxkBAAIBDmqY_dtm16Rhp9jSESjwVhCdAaznAAIsDgACEtFpUV-I4u72ln7CPQQ", title: "ድርሳነ ቅዱስ ሩፋኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ቅዱስ ሩፋኤል..." },
    { id: "8", file_id: "BQACAgEAAxkBAAIBEGqY_us4NhTLt8P2KJX-VWtR4TraAAJRAgACYHfoRvu7BfQqD_cVPQQ", title: "ድርሳነ ማሕየዊ ምስለ መልክዑ", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ማሕየዊ ምስለ መልክዑ..." },
    { id: "99", file_id: "DUMMY_GEEZ_GDSL_05", title: "We add soon/በቅርቡ እንጨምራለን", preview: "መጽሐፉ በቅርቡ ይጨመራል..." }
  ],
  "geez_ot": [
    { id: "1", file_id: "BQACAgQAAxkBAAMYapd7UbkpzfZTIng9daYvw8A1q-4AAn0JAAIWA9hQw4UxsdCUEow9BA", title: "፭ቱ መጽሐፍተ ኦሪት ብራና ትርጓሜ", preview: "ይህ የ፭ቱ መጽሐፍተ ኦሪት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GEEZ_OT_02", title: "ኦሪት ዘጸአት (ግዕዝ)", preview: "ይህ የኦሪት ዘጸአት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GEEZ_OT_03", title: "መጽሐፈ መዝሙር (ግዕዝ)", preview: "ይህ የመጽሐፈ መዝሙር መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GEEZ_OT_04", title: "መጽሐፈ ኢሳይያስ (ግዕዝ)", preview: "ይህ የመጽሐፈ ኢሳይያስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GEEZ_OT_05", title: "መጽሐፈ ምሳሌ (ግዕዝ)", preview: "ይህ የመጽሐፈ ምሳሌ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "geez_nt": [
    { id: "1", file_id: "BQACAgQAAxkBAAMaapd8piiIyiFFa_-dYnnKkqU2RgcAAgMeAALIlMFT0Y7m-S1fk-I9BA", title: "ሙሉው ሐዲስ ኪዳን የጸዳ(ሚነበብ) ብራና", preview: "ይህ የሙሉው ሐዲስ ኪዳን መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GEEZ_NT_02", title: "ወንጌል ዘዮሐንስ (ግዕዝ)", preview: "ይህ የወንጌል ዘዮሐንስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GEEZ_NT_03", title: "ግብረ ሐዋርያት (ግዕዝ)", preview: "ይህ የግብረ ሐዋርያት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GEEZ_NT_04", title: "መልእክተ ጳውሎስ (ግዕዝ)", preview: "ይህ የመልእክተ ጳውሎስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GEEZ_NT_05", title: "ራእየ ዮሐንስ (ግዕዝ)", preview: "ይህ የራእየ ዮሐንስ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "ga_law": [
    { id: "1", file_id: "DUMMY_GA_LAW_01", title: "ፍትሐ ነገሥት ንባቡና ትርጓሜው", preview: "ይህ የፍትሐ ነገሥት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GA_LAW_02", title: "ሥርዓተ ቤተ ክርስቲያን ትርጓሜ", preview: "ይህ የሥርዓተ ቤተ ክርስቲያን መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GA_LAW_03", title: "መጽሐፈ ዲደስቅልያ ትርጓሜ", preview: "ይህ የመጽሐፈ ዲደስቅልያ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GA_LAW_04", title: "ቃኖና ቤተ ክርስቲያን", preview: "ይህ የቃኖና ቤተ ክርስቲያን መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GA_LAW_05", title: "መጽሐፈ ቅዳሴ ንባቡና ትርጓሜው", preview: "ይህ የመጽሐፈ ቅዳሴ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "ga_hist": [
    { id: "1", file_id: "DUMMY_GA_HIST_01", title: "ዜና አይሁድ ትርጓሜ", preview: "ይህ የዜና አይሁድ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GA_HIST_02", title: "መጽሐፈ አክሱም ትርጓሜ", preview: "ይህ የመጽሐፈ አክሱም መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GA_HIST_03", title: "ታሪከ ነገሥት ዘኢትዮጵያ", preview: "ይህ የታሪከ ነገሥት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GA_HIST_04", title: "ዜና እስክንድር ትርጓሜ", preview: "ይህ የዜና እስክንድር መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GA_HIST_05", title: "መጽሐፈ ሱባኤ ትርጓሜ", preview: "ይህ የመጽሐፈ ሱባኤ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "ga_gdsl": [
    { id: "1", file_id: "BQACAgQAAxkBAAPWaphINHM2lRkznNEzSJovZdpcrzwAApMdAALp9MhQlhG908oUFio9BA", title: "ድርሳነ ሚካኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሊቀ መላእክት ቅዱስ ሚካኤል..." },
    { id: "2", file_id: "BQACAgQAAxkBAAP0apjiCWvVv63N4thgtKqSSSTG9mAAAtUhAAKuXclQxitdVaULcDM9BA", title: "ድርሳነ ራጉኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ቅዱስ ራጉኤል..." },
    { id: "3", file_id: "BQACAgQAAxkBAAPoapjbcyXFg9F4CFUuWjj1-LTQ1OEAAv8WAAK4B1FQGnav1e-AgJc9BA", title: "ድርሳነ ሰንበት", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ቅዱስ ሰንበት..." },
    { id: "4", file_id: "BQACAgQAAxkBAAP-apjsYNMJPvsbCSIwvSEftWz1Or8AAtUaAAIiroFRnGC9dtNUZi89BA", title: "ድርሳነ ዑራኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ቅዱስ ዑራኤል..." },
    { id: "5", file_id: "BQACAgQAAxkBAAIBCmqY_KO_j0lGIMgcf-0leltOH1hNAAJ1FAAC45BxUwH6hyap6vD1PQQ", title: "ድርሳነ መድኃኔ ዓለም ገድለ አቡነ መባዓ ጽዮን", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ መድኃኔ ዓለም..." },
    { id: "6", file_id: "BQACAgQAAxkBAAIBFGqY_9c_xTeW1Ox68xksvGHi6qRXAAK1GQACBzpJU7ddXZ-PfJNrPQQ", title: "ዜና ሥላሴ ግእዝ - አምሐርኛ", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ዜና ሥላሴ..." },
    { id: "99", file_id: "ghhguuug", title: "we add soon/በቅርቡ እንጨምራለን", preview: "መጽሐፉ በቅርቡ ይጨመራል..." }
  ],
  "ga_ot": [
    { id: "1", file_id: "DUMMY_GA_OT_01", title: "ኦሪት ዘፍጥረት ንባቡና ትርጓሜው", preview: "ይህ የኦሪት ዘፍጥረት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_GA_OT_02", title: "ኦሪት ዘጸአት ንባቡና ትርጓሜው", preview: "ይህ የኦሪት ዘጸአት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GA_OT_03", title: "መዝሙረ ዳዊት ንባቡና ትርጓሜው", preview: "ይህ የመዝሙረ ዳዊት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GA_OT_04", title: "መጽሐፈ ኢሳይያስ ትርጓሜ", preview: "ይህ የመጽሐፈ ኢሳይያስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GA_OT_05", title: "መጽሐፈ ምሳሌ ትርጓሜ", preview: "ይህ የመጽሐፈ ምሳሌ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "ga_nt": [
    { id: "1", file_id: "BQACAgQAAxkBAAN0apersTfkSpLpXujQvxu4zFJ8MioAAmceAAK225lQA3vS59CEP0U9BA", title: "ወንጌል ዘማቴዎስ ትርጓሜ", preview: "ይህ የወንጌል ዘማቴዎስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "BQACAgQAAxkBAAN0apersTfkSpLpXujQvxu4zFJ8MioAAmceAAK225lQA3vS59CEP0U9BA", title: "ወንጌል ዘማርቆስ ትርጓሜ", preview: "ይህ የወንጌል ዘማርቆስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "BQACAgQAAxkBAANyapersQ98wbYKC8-79MnvYLqhKTAAAmQeAAK225lQS9MwBsORgaI9BA", title: "ወንጌል ዘሉቃድ ትርጓሜ", preview: "ይህ የወንጌል ዘሉቃድ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "BQACAgQAAxkBAANzapersT-LRq5gCg7KU_3K9e6EKmoAAhkbAAJt8rhSH2tfVI7_W4M9BA", title: "ወንጌል ዘዮሐንስ ትርጓሜ", preview: "ይህ የወንጌል ዘዮሐንስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "BQACAgQAAxkBAAOBape555kx5chgTM0HuqJivR3bDuQAAg0YAALB61hQCIYaj31GHiw9BA", title: "የሐዋርያት ሥራ ትርጓሜ", preview: "ይህ የየሐዋርያት ሥራ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "6", file_id: "BQACAgQAAxkBAAODape9bjU5mP1luEgC_j0DZ7whg_kAAowYAAI1KphTzq16eyFGTF89BA", title: "ሮሜ አንድምታ ትርጓሜ", preview: "ይህ የሮሜ አንድምታ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "7", file_id: "BQACAgQAAxkBAAOFape-Oj3cIsSv4xdiAoptKykB7gAD7yAAAlx_WVMPRIXfrWJIhT0E", title: "ወደ ሮሜ ንባቡና ትርጓሜ", preview: "ይህ የወደ ሮሜ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "geez_edu": [
    { 
      id: "1", 
      file_id: "BQACAgQAAxkBAAMQapdxmNt2UHnzrQim-4cLtqskVeoAAqofAAI12zhQxSRCSEyXyN89BA", 
      title: "መጽሐፈ ሰዋስው ወግስ ወመዝገበ ቃላት ሐዲስ",
      preview: "ይህ የመጽሐፈ ሰዋስው መጽሐፍ የመጀመሪያ ገጽ ነው..." 
    },
    { id: "2", file_id: "DUMMY_GEEZ_EDU_02", title: "የሰዋስው ወሰወሰ ግዕዝ", preview: "ይህ የየሰዋስው ወሰወሰ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_GEEZ_EDU_03", title: "መዝገበ ቃላት ግዕዝ-አማርኛ", preview: "ይህ የመዝገበ ቃላት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_GEEZ_EDU_04", title: "የግዕዝ ግሥ መጽሐፍ", preview: "ይህ የየግዕዝ ግሥ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_GEEZ_EDU_05", title: "መጽሐፈ ሰዋስው ዘግዕዝ", preview: "ይህ የመጽሐፈ ሰዋስው ዘግዕዝ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_law": [
    { id: "1", file_id: "DUMMY_AMH_LAW_01", title: "የቤተ ክርስቲያን ሕግና ሥርዓት", preview: "ይህ የየቤተ ክርስቲያን ሕግና ሥርዓት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_LAW_02", title: "የሥርዓተ ቅዳሴ ማብራሪያ", preview: "ይህ የየሥርዓተ ቅዳሴ ማብራሪያ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_LAW_03", title: "የክርስቲያን ሕይወትና ሥርዓት", preview: "ይህ የየክርስቲያን ሕይወትና ሥርዓት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_LAW_04", title: "የፍትሐ ነገሥት ማብራሪያ", preview: "ይህ የየፍትሐ ነገሥት ማብራሪያ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_LAW_05", title: "የቅዱሳት ምስጢራት ሥርዓት", preview: "ይህ የየቅዱሳት ምስጢራት ሥርዓት መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_hist": [
    { id: "1", file_id: "DUMMY_AMH_HIST_01", title: "የኢትዮጵያ ቤተ ክርስቲያን ታሪክ", preview: "ይህ የየኢትዮጵያ ቤተ ክርስቲያን ታሪክ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_HIST_02", title: "የዓለም ቤተ ክርስቲያን ታሪክ", preview: "ይህ የየዓለም ቤተ ክርስቲያን ታሪክ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_HIST_03", title: "የታሪከ ነገሥት ማጠቃለያ", preview: "ይህ የየታሪከ ነገሥት ማጠቃለያ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_HIST_04", title: "የቅዱሳን አበው ታሪክ", preview: "ይህ የየቅዱሳን አበው ታሪክ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_HIST_05", title: "የዜና መዋዕል ታሪክ", preview: "ይህ የየዜና መዋዕል ታሪክ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_gdsl": [
    { id: "1", file_id: "BQACAgQAAxkBAAIBEmqY_2wbgWxZz0w-DWy5K9vxVTh9AALXDgACKQABkFG92rcZN_zt1j0E", title: "የማኅበረ መላእክት ድርሳን", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። የማኅበረ መላእክት ድርሳን..." },
    { id: "2", file_id: "BQACAgQAAxkBAAPmapjaUtdihEG1XhcgCcLy7b5BI0AAtEhAAKuXclQ9tP3te9qdCs9BA", title: "ድርሳነ ፋኑኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ቅዱስ ፋኑኤል..." },
    { id: "3", file_id: "BQACAgQAAxkBAAPaapjWdaw1Ga6g7FxtNE60cof2XMIAAncaAAKoDpFTQGuC3QGlKiU9BA", title: "ድርሳነ ገብርኤል", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ሊቀ መላእክት ቅዱስ ገብርኤል..." },
    { id: "4", file_id: "BQACAgQAAxkBAAPdapjXFTvN6JURihRCBgMWvp-FMiwAAlMOAAJ-QsFTMzSaI8GVtj49BA", title: "ድርሳነ ማሕየዊ", preview: "በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን። ድርሳነ ቅዱስ ማሕየዊ..." },
    { id: "99", file_id: "DUMMY_AMH_GDSL_05", title: "We add soon/በቅርቡ እንጨምራለን", preview: "መጽሐፉ በቅርቡ ይጨመራል..." }
  ],
  "amh_eth": [
    { id: "1", file_id: "DUMMY_AMH_ETH_01", title: "ክርስቲያናዊ ሥነ ምግባር", preview: "ይህ የክርስቲያናዊ ሥነ ምግባር መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_ETH_02", title: "የሕይወት ጎዳና", preview: "ይህ የየሕይወት ጎዳና መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_ETH_03", title: "የበጎ አድራጎት ትምህርት", preview: "ይህ የየበጎ አድራጎት ትምህርት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_ETH_04", title: "የትህትናና የፍቅር ሕይወት", preview: "ይህ የየትህትናና የፍቅር ሕይወት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_ETH_05", title: "የቤተሰብ ክርስቲያናዊ መመሪያ", preview: "ይህ የየቤተሰብ ክርስቲያናዊ መመሪያ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_ot": [
    { id: "1", file_id: "DUMMY_AMH_OT_01", title: "ኦሪት ዘፍጥረት በአማርኛ", preview: "ይህ የኦሪት ዘፍጥረት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_OT_02", title: "ኦሪት ዘጸአት በአማርኛ", preview: "ይህ የኦሪት ዘጸአት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_OT_03", title: "መዝሙረ ዳዊት በአማርኛ", preview: "ይህ የመዝሙረ ዳዊት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_OT_04", title: "መጽሐፈ ኢሳይያስ በአማርኛ", preview: "ይህ የመጽሐፈ ኢሳይያስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_OT_05", title: "መጽሐፈ ምሳሌ በአማርኛ", preview: "ይህ የመጽሐፈ ምሳሌ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_nt": [
    { id: "1", file_id: "DUMMY_AMH_NT_01", title: "የቅዱስ ማቴዎስ ወንጌል", preview: "ይህ የየቅዱስ ማቴዎስ ወንጌል መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_NT_02", title: "የቅዱስ ዮሐንስ ወንጌል", preview: "ይህ የየቅዱስ ዮሐንስ ወንጌል መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_NT_03", title: "የሐዋርያት ሥራ", preview: "ይህ የየሐዋርያት ሥራ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_NT_04", title: "የቅዱስ ጳውሎስ መልእክት", preview: "ይህ የየቅዱስ ጳውሎስ መልእክት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_NT_05", title: "የቅዱስ ዮሐንስ ራእይ", preview: "ይህ የየቅዱስ ዮሐንስ ራእይ መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_std": [
    { id: "1", file_id: "DUMMY_AMH_STD_01", title: "የመጽሐፍ ቅዱስ ጥናት መመሪያ", preview: "ይህ የየመጽሐፍ ቅዱስ ጥናት መመሪያ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_STD_02", title: "የመጽሐፍ ቅዱስ መዝገበ ቃላት", preview: "ይህ የየመጽሐፍ ቅዱስ መዝገበ ቃላት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_STD_03", title: "የብሉይ ኪዳን ጥናት", preview: "ይህ የየብሉይ ኪዳን ጥናት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_STD_04", title: "የአዲስ ኪዳን ጥናት", preview: "ይህ የየአዲስ ኪዳን ጥናት መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_STD_05", title: "የትንቢት መጻሕፍት ጥናት", preview: "ይህ የየትንቢት መጻሕፍት ጥናት መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_chr": [
    { id: "1", file_id: "BQACAgQAAxkBAAMuapeKeQL2zvehmKt3MO2gUxGVZvQAAmEZAAL-iRFSUPgwjQABaU7tPQQ", title: "ነገረ ክርስቶስ መ/ር በትረ ማርያም", preview: "ይህ የነገረ ክርስቶስ መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "BQACAgIAAxkBAAMtapeKNEeBt2v9bN9-QVFpLZtnPbAAArJbAAJlqAFJmPw18dc07Rw9BA", title: "በነገረ ክርስቶስ ላይ የተነሱ ጥያቄዎች እና መልሶቻቸው Dr ሮዳስ ታደሰ", preview: "ይህ የበነገረ ክርስቶስ ላይ የተነሱ ጥያቄዎች መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_CHR_03", title: "ነገረ ክርስቶስ ትምህርት 3", preview: "ይህ የነገረ ክርስቶስ ትምህርት 3 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_CHR_04", title: "ነገረ ክርስቶስ ትምህርት 4", preview: "ይህ የነገረ ክርስቶስ ትምህርት 4 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_CHR_05", title: "ነገረ ክርስቶስ ትምህርት 5", preview: "ይህ የነገረ ክርስቶስ ትምህርት 5 መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_mry": [
    { id: "1", file_id: "BQACAgQAAxkBAAMcapd9mbw5iHKJf-7Y1JPbLh2sGTMAAvEKAAIn8NhRpbFmUy6n4sw9BA", title: "ነገረ ማርያም በሐዲስ ኪዳን Dr ሮዳስ ታደሰ", preview: "ይህ የነገረ ማርያም መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_MRY_02", title: "ነገረ ማርያም ትምህርት 2", preview: "ይህ የነገረ ማርያም ትምህርት 2 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_MRY_03", title: "ነገረ ማርያም ትምህርት 3", preview: "ይህ የነገረ ማርያም ትምህርት 3 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_MRY_04", title: "ነገረ ማርያም ትምህርት 4", preview: "ይህ የነገረ ማርያም ትምህርት 4 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_MRY_05", title: "ነገረ ማርያም ትምህርት 5", preview: "ይህ የነገረ ማርያም ትምህርት 5 መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_snt": [
    { id: "1", file_id: "DUMMY_AMH_SNT_01", title: "ነገረ ቅዱሳን ትምህርት 1", preview: "ይህ የነገረ ቅዱሳን ትምህርት 1 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_SNT_02", title: "ነገረ ቅዱሳን ትምህርት 2", preview: "ይህ የነገረ ቅዱሳን ትምህርት 2 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_SNT_03", title: "ነገረ ቅዱሳን ትምህርት 3", preview: "ይህ የነገረ ቅዱሳን ትምህርት 3 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_SNT_04", title: "ነገረ ቅዱሳን ትምህርት 4", preview: "ይህ የነገረ ቅዱሳን ትምህርት 4 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_SNT_05", title: "ነገረ ቅዱሳን ትምህርት 5", preview: "ይህ የነገረ ቅዱሳን ትምህርት 5 መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "amh_thl": [
    { id: "1", file_id: "DUMMY_AMH_THL_01", title: "የሃይማኖት መሠረት 1", preview: "ይህ የየሃይማኖት መሠረት 1 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "2", file_id: "DUMMY_AMH_THL_02", title: "የሃይማኖት መሠረት 2", preview: "ይህ የየሃይማኖት መሠረት 2 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "3", file_id: "DUMMY_AMH_THL_03", title: "የሃይማኖት መሠረት 3", preview: "ይህ የየሃይማኖት መሠረት 3 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "4", file_id: "DUMMY_AMH_THL_04", title: "የሃይማኖት መሠረት 4", preview: "ይህ የየሃይማኖት መሠረት 4 መጽሐፍ የመጀመሪያ ገጽ ነው..." },
    { id: "5", file_id: "DUMMY_AMH_THL_05", title: "የሃይማኖት መሠረት 5", preview: "ይህ የየሃይማኖት መሠረት 5 መጽሐፍ የመጀመሪያ ገጽ ነው..." }
  ],
  "eng_law": [
    { id: "1", file_id: "DUMMY_ENG_LAW_01", title: "Fetha Nagast (English)", preview: "This is the first page of Fetha Nagast..." },
    { id: "2", file_id: "DUMMY_ENG_LAW_02", title: "Canon Law of Orthodox Church", preview: "This is the first page of Canon Law..." },
    { id: "3", file_id: "DUMMY_ENG_LAW_03", title: "The Didascalia (English)", preview: "This is the first page of The Didascalia..." },
    { id: "4", file_id: "DUMMY_ENG_LAW_04", title: "Liturgy and Order", preview: "This is the first page of Liturgy and Order..." },
    { id: "5", file_id: "DUMMY_ENG_LAW_05", title: "Ecclesiastical Canons", preview: "This is the first page of Ecclesiastical Canons..." }
  ],
  "eng_hist": [
    { id: "1", file_id: "DUMMY_ENG_HIST_01", title: "History of Ethiopian Church", preview: "This is the first page of History of Ethiopian Church..." },
    { id: "2", file_id: "DUMMY_ENG_HIST_02", title: "Kebra Nagast (English)", preview: "This is the first page of Kebra Nagast..." },
    { id: "3", file_id: "DUMMY_ENG_HIST_03", title: "Lives of Ethiopian Saints", preview: "This is the first page of Lives of Ethiopian Saints..." },
    { id: "4", file_id: "DUMMY_ENG_HIST_04", title: "Chronicles of Kings", preview: "This is the first page of Chronicles of Kings..." },
    { id: "5", file_id: "DUMMY_ENG_HIST_05", title: "Ancient Aksum History", preview: "This is the first page of Ancient Aksum History..." }
  ],
  "eng_eth": [
    { id: "1", file_id: "DUMMY_ENG_ETH_01", title: "Orthodox Christian Ethics", preview: "This is the first page of Orthodox Christian Ethics..." },
    { id: "2", file_id: "DUMMY_ENG_ETH_02", title: "Path to Holiness", preview: "This is the first page of Path to Holiness..." },
    { id: "3", file_id: "DUMMY_ENG_ETH_03", title: "Spiritual Discipline", preview: "This is the first page of Spiritual Discipline..." },
    { id: "4", file_id: "DUMMY_ENG_ETH_04", title: "Christian Virtues", preview: "This is the first page of Christian Virtues..." },
    { id: "5", file_id: "DUMMY_ENG_ETH_05", title: "Family and Faith", preview: "This is the first page of Family and Faith..." }
  ],
  "eng_ot": [
    { id: "1", file_id: "DUMMY_ENG_OT_01", title: "Book of Genesis (English)", preview: "This is the first page of Book of Genesis..." },
    { id: "2", file_id: "DUMMY_ENG_OT_02", title: "Book of Exodus (English)", preview: "This is the first page of Book of Exodus..." },
    { id: "3", file_id: "DUMMY_ENG_OT_03", title: "Psalms of David", preview: "This is the first page of Psalms of David..." },
    { id: "4", file_id: "DUMMY_ENG_OT_04", title: "Book of Enoch", preview: "This is the first page of Book of Enoch..." },
    { id: "5", file_id: "DUMMY_ENG_OT_05", title: "Book of Jubilees", preview: "This is the first page of Book of Jubilees..." }
  ],
  "eng_thl": [
    { id: "1", file_id: "DUMMY_ENG_THL_01", title: "Orthodox Theology Basics", preview: "This is the first page of Orthodox Theology Basics..." },
    { id: "2", file_id: "DUMMY_ENG_THL_02", title: "Mariology in Tradition", preview: "This is the first page of Mariology in Tradition..." },
    { id: "3", file_id: "DUMMY_ENG_THL_03", title: "Christology Principles", preview: "This is the first page of Christology Principles..." },
    { id: "4", file_id: "DUMMY_ENG_THL_04", title: "The Holy Sacraments", preview: "This is the first page of The Holy Sacraments..." },
    { id: "5", file_id: "DUMMY_ENG_THL_05", title: "Dogmatic Theology", preview: "This is the first page of Dogmatic Theology..." }
  ]
};

// ==========================================
// 6. HELPER FUNCTIONS
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
}

function findBook(catKey, bookId) {
  if (!booksDatabase[catKey]) return null;
  return booksDatabase[catKey].find(b => b.id === bookId);
}

function trackDownload(userId, catKey, bookId) {
  if (!db.users[userId]) return;
  db.users[userId].total_downloads = (db.users[userId].total_downloads || 0) + 1;
  const bookKey = `${catKey}_${bookId}`;
  if (!db.users[userId].books_downloaded) {
    db.users[userId].books_downloaded = [];
  }
  if (!db.users[userId].books_downloaded.includes(bookKey)) {
    db.users[userId].books_downloaded.push(bookKey);
  }
  if (!db.bookStats) db.bookStats = {};
  if (!db.bookStats[bookKey]) db.bookStats[bookKey] = 0;
  db.bookStats[bookKey]++;
  saveDatabase();
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
// 7. RECEIPT VALIDATION
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
  if (fileType === 'photo' || fileType === 'document') {
    confidence += 15;
    reasons.push(`File type is ${fileType}`);
  }
  if (textToCheck.includes('0100775011101') || textToCheck.includes('1000661046841') || 
      textToCheck.includes('57080698') || textToCheck.includes('0943910036')) {
    confidence += 30;
    reasons.push(`Contains bank account number`);
  }
  if (textToCheck.includes('matewos') || textToCheck.includes('ማቴዎስ')) {
    confidence += 15;
    reasons.push(`Contains recipient name`);
  }
  const hasDatePattern = /\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/.test(textToCheck);
  const hasAmountPattern = /\d{1,3}(,\d{3})*(\.\d{2})?/.test(textToCheck);
  if (hasDatePattern) {
    confidence += 5;
    reasons.push(`Contains date pattern`);
  }
  if (hasAmountPattern) {
    confidence += 5;
    reasons.push(`Contains amount pattern`);
  }
  return {
    isValid: confidence >= 40,
    confidence,
    reasons: reasons.join(', ')
  };
}

// ==========================================
// 8. MAIN KEYBOARD
// ==========================================
const mainKeyboard = Markup.keyboard([
  ['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ'],
  ['📞 Contact Me', '💬 Feedback'],
  ['📊 My Stats', '🔄 Start']
]).resize();

// ==========================================
// 9. ERROR HANDLING & LOGGING
// ==========================================
function logActivity(userId, action, details) {
  try {
    const logFile = path.join(__dirname, 'activity.log');
    const logEntry = `[${new Date().toISOString()}] User: ${userId} | Action: ${action} | ${JSON.stringify(details)}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (e) {}
}

function logError(type, error) {
  try {
    const logFile = path.join(__dirname, 'error.log');
    const logEntry = `[${new Date().toISOString()}] ${type}: ${error.stack || error.message || error}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (e) {}
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
// 10. RATE LIMITING
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
// 11. INTERACTIVE ADD BOOK
// ==========================================
bot.command('addbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return ctx.reply("⛔ ይህ ትዕዛዝ ለአድሚን ብቻ ነው!");
  }
  
  if (addBookSessions[userId]) {
    return ctx.reply("⚠️ አሁን መጽሐፍ እየጨመሩ ነው! /canceladd ይጠቀሙ።");
  }
  
  addBookSessions[userId] = { step: 'title' };
  ctx.reply(
    `📚 **Add a New Book**\n\n` +
    `**Step 1: Enter Book Title**\n\n` +
    `✏️ Please type the full title:\n` +
    `Example: \`ድርሳነ ሚካኤል ብራና\``,
    { parse_mode: 'Markdown' }
  );
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  if (!addBookSessions[userId]) return;
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
      `✅ Title: \`${session.title}\`\n\n` +
      `📄 **Step 2: Enter Preview**\n\n` +
      `✏️ Type preview text. Type \`/done\` when finished.`,
      { parse_mode: 'Markdown' }
    );
  }
  
  if (session.step === 'preview') {
    if (text === '/done') {
      if (!session.preview || session.preview.trim().length < 10) {
        return ctx.reply("⚠️ Preview too short! Write at least 10 characters.");
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
    return ctx.reply(`📄 Updated! (${wordCount} words) Type /done when finished.`);
  }
});

bot.action(/^addcat_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  const category = ctx.match[1];
  if (!isAdmin(userId)) return ctx.answerCbQuery("⛔ ለአድሚን ብቻ!", { show_alert: true });
  if (!addBookSessions[userId]) return ctx.answerCbQuery("⚠️ /addbook ይጠቀሙ!", { show_alert: true });
  
  const session = addBookSessions[userId];
  session.category = category;
  session.step = 'file';
  
  ctx.editMessageText(
    `✅ Category: \`${category}\`\n\n📎 **Step 4: Send the Book File**`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('cancel_add_book', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.editMessageText("❌ ተሰርዟል።");
  }
});

bot.command('canceladd', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.reply("❌ ተሰርዟል።");
  } else {
    ctx.reply("⚠️ ምንም እየተጨመረ ያለ ነገር የለም።");
  }
});

// ==========================================
// 12. FILE HANDLER
// ==========================================
function extractFileInfo(msg) {
  if (msg.document) {
    return {
      type: 'document',
      fileId: msg.document.file_id,
      fileName: msg.document.file_name || 'Document.pdf',
      mimeType: msg.document.mime_type || 'application/pdf',
      fileSize: msg.document.file_size || 0
    };
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

  // Check if part of Add Book session
  if (addBookSessions[userId] && addBookSessions[userId].step === 'file') {
    const session = addBookSessions[userId];
    const fileInfo = extractFileInfo(message);
    if (!fileInfo) return ctx.reply("❌ የፋይሉ መረጃ ሊገኝ አልቻለም።");
    
    const category = session.category;
    const books = booksDatabase[category];
    let maxId = 0;
    books.forEach(book => { const numId = parseInt(book.id); if (!isNaN(numId) && numId > maxId) maxId = numId; });
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

  // Admin: Get File ID
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

  // Non-admin: Receipt validation
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
  } catch (error) {
    console.error(error);
    ctx.reply("⚠️ Error processing receipt.");
  }
});

// ==========================================
// 13. COMMANDS & MENU HANDLERS
// ==========================================
bot.start((ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  registerUser(ctx.from);
  const user = db.users[userId];
  let msg = "እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት መጡ! 📚✨\n\n";
  msg += user.is_paid ? "✅ ክፍያ ፈጽመዋል! ሁሉንም መጽሐፍት ማውረድ ይችላሉ።\n" : "💰 200 ብር ክፈሉ።\n";
  msg += `📚 ${user.total_downloads || 0} መጽሐፍት አውርደዋል።`;
  ctx.reply(msg, mainKeyboard);
});

bot.hears('📚 መጽሐፍት', (ctx) => {
  ctx.reply(
    "እባኮን ቋንቋ ይምረጡ:",
    Markup.inlineKeyboard([
      [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
      [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
      [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("In English", "lang_eng")]
    ])
  );
});

bot.hears('📊 My Stats', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  if (!stats) return ctx.reply("❌ መረጃ አልተገኘም።");
  ctx.reply(
    `📊 **Your Stats**\n\n👤 ${stats.username}\n💰 ${stats.is_paid ? '✅ Paid' : '❌ Not Paid'}\n📚 ${stats.total_downloads} downloads\n📖 ${stats.books_downloaded} unique books\n🌍 ${stats.preferred_language}`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📞 Contact Me', (ctx) => ctx.reply(`📞 ${ADMIN_USERNAME}\n📧 matewosgetahunseifu@gmail.com`));
bot.hears('💬 Feedback', (ctx) => ctx.reply(`💬 ${ADMIN_USERNAME}\n📧 matewosgetahunseifu@gmail.com`));
bot.hears('🔄 Start', (ctx) => ctx.reply("እንኳን ደህና መጡ!", mainKeyboard));

// ==========================================
// 14. CATEGORY ROUTING
// ==========================================
bot.action("lang_geez", (ctx) => {
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

bot.action("lang_amh", (ctx) => {
  ctx.editMessageText(
    "በአማርኛ ምድብ ይምረጡ:",
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

bot.action("lang_eng", (ctx) => {
  ctx.editMessageText(
    "Select category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Law & Order", "cat_eng_law")],
      [Markup.button.callback("History & Discourse", "cat_eng_hist")],
      [Markup.button.callback("Christian Ethics", "cat_eng_eth")],
      [Markup.button.callback("Bible Study", "cat_eng_ot")],
      [Markup.button.callback("Theology & Dogma", "cat_eng_thl")],
      [Markup.button.callback("⬅️ Back", "back_to_lang")]
    ])
  );
});

bot.action("back_to_lang", (ctx) => {
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
// 15. BOOK DISPLAY & DELIVERY
// ==========================================
bot.action(/^cat_(.+)$/, (ctx) => {
  const catKey = ctx.match[1];
  const books = booksDatabase[catKey];
  if (!books || books.length === 0) return ctx.answerCbQuery("ምንም መጽሐፍ የለም", { show_alert: true });
  
  const buttons = books.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${catKey}_${book.id}`)
  ]);
  buttons.push([Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]);
  ctx.editMessageText("መጽሐፍ ይምረጡ:", Markup.inlineKeyboard(buttons));
});

bot.action(/^gb_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);
  if (!book) return ctx.answerCbQuery("መጽሐፉ አልተገኘም", { show_alert: true });

  if (!isPaidUser(userId)) {
    return ctx.reply(
      `📖 **${book.title}**\n\n📄 **Preview:**\n${book.preview || 'Preview not available'}\n\n━━━━━━━━━━━━━━━━━━━━━\n📚 **200 ETB** one-time payment\n\n💳 CBE: 1000661046841\n💳 Telebirr: 0943910036\n👤 Matewos Getahun Seifu\n\n📸 Send receipt after payment.`,
      { parse_mode: 'Markdown' }
    );
  }

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨`,
    protect_content: true
  }).then(() => trackDownload(userId, catKey, bookId)).catch(() => {
    ctx.reply(`❌ ${book.title} - File not found.`);
  });
});

// ==========================================
// 16. ADMIN COMMANDS
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

bot.command('backup', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  ctx.replyWithDocument({
    source: Buffer.from(JSON.stringify(db, null, 2), 'utf-8'),
    filename: `backup_${Date.now()}.json`
  }, { caption: "📦 Database Backup" });
});

// ==========================================
// 17. ADMIN ACTIONS (Approve/Reject)
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
// 18. SEARCH
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => ctx.reply("🔍 Enter book title to search:"));

bot.on('text', (ctx) => {
  const text = ctx.message.text;
  if (['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ', '📞 Contact Me', '💬 Feedback', '📊 My Stats', '🔄 Start'].includes(text) || text.startsWith('/')) return;

  const query = text.trim().toLowerCase();
  let matches = [];
  Object.keys(booksDatabase).forEach(catKey => {
    booksDatabase[catKey].forEach(book => {
      if (book.title.toLowerCase().includes(query)) matches.push({ ...book, catKey });
    });
  });

  if (matches.length === 0) return ctx.reply(`🔍 No results for "${text}"`);
  const buttons = matches.slice(0, 20).map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.catKey}_${book.id}`)
  ]);
  ctx.reply(`🔍 ${matches.length} results:`, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 19. LAUNCH
// ==========================================
bot.catch((err, ctx) => {
  console.error('❌ Error:', err);
  logError('bot_catch', err);
});

bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log("✅ Bot is running...");
  console.log("📚 Orthodox Spiritual Books Bot is ready!");
  console.log("👑 Admin IDs:", ADMIN_IDS);
  console.log(`📖 Total Books: ${Object.values(booksDatabase).reduce((s, c) => s + c.length, 0)}`);
}).catch(err => console.error("❌ Failed to launch:", err));

process.once('SIGINT', () => { saveDatabase(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { saveDatabase(); bot.stop('SIGTERM'); });