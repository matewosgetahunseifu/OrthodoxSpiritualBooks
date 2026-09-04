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
  
  // Track book stats
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
  
  const isValid = confidence >= 40;
  
  return {
    isValid,
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
// 11. INTERACTIVE ADD BOOK (Combined best of both)
// ==========================================
bot.command('addbook', (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return ctx.reply("⛔ ይህ ትዕዛዝ ለአድሚን ብቻ ነው!");
  }
  
  if (addBookSessions[userId]) {
    return ctx.reply(
      "⚠️ አሁን መጽሐፍ እየጨመሩ ነው!\n" +
      "እባክዎትን መጀመሪያ ያለውን ይጨርሱ ወይም /canceladd ይጠቀሙ።"
    );
  }
  
  addBookSessions[userId] = { step: 'title' };
  
  ctx.reply(
    `📚 **Add a New Book**\n\n` +
    `**Step 1: Enter Book Title**\n\n` +
    `✏️ Please type the full title of the book:\n` +
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
    return ctx.reply("❌ መጽሐፍ መጨመር ተሰርዟል።");
  }
  
  if (session.step === 'title') {
    session.title = text.trim();
    session.step = 'preview';
    session.preview = '';
    
    return ctx.reply(
      `✅ Title: \`${session.title}\`\n\n` +
      `📄 **Step 2: Enter Preview Text**\n\n` +
      `✏️ Please type the preview text (first 20-25 pages or a summary):\n` +
      `📌 When done, type \`/done\` to finish preview.`,
      { parse_mode: 'Markdown' }
    );
  }
  
  if (session.step === 'preview') {
    if (text === '/done') {
      if (!session.preview || session.preview.trim().length < 10) {
        return ctx.reply("⚠️ Preview is too short! Please write at least 10 characters.");
      }
      
      session.step = 'category';
      
      // Show categories as buttons
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
        `✅ Preview saved: ${session.preview.substring(0, 50)}...\n\n` +
        `📂 **Step 3: Select Category**\n\n` +
        `Please choose a category from the buttons below:`,
        Markup.inlineKeyboard(categoryButtons)
      );
    }
    
    if (!session.preview) {
      session.preview = text;
    } else {
      session.preview += '\n\n' + text;
    }
    
    const wordCount = session.preview.split(' ').length;
    return ctx.reply(
      `📄 Preview updated! (${wordCount} words so far)\n\n` +
      `✏️ Continue typing or type \`/done\` when finished.`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Category selection from buttons
bot.action(/^addcat_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  const category = ctx.match[1];
  
  if (!isAdmin(userId)) {
    return ctx.answerCbQuery("⛔ ይህ ለአድሚን ብቻ ነው!", { show_alert: true });
  }
  
  if (!addBookSessions[userId]) {
    return ctx.answerCbQuery("⚠️ /addbook ይጠቀሙ!", { show_alert: true });
  }
  
  const session = addBookSessions[userId];
  session.category = category;
  session.step = 'file';
  
  ctx.editMessageText(
    `✅ Category: \`${category}\`\n\n` +
    `📎 **Step 4: Send the Book File**\n\n` +
    `📤 Please send the book file (PDF, photo, video, etc.) to complete.\n\n` +
    `💡 This is the final step!`,
    { parse_mode: 'Markdown' }
  );
});

// Cancel button
bot.action('cancel_add_book', (ctx) => {
  const userId = ctx.from.id;
  if (addBookSessions[userId]) {
    delete addBookSessions[userId];
    ctx.editMessageText("❌ መጽሐፍ መጨመር ተሰርዟል።");
  } else {
    ctx.answerCbQuery("❌ ምንም እየተጨመረ ያለ መጽሐፍ የለም");
  }
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
// 12. FILE HANDLER WITH ADD BOOK SUPPORT
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

// Main file handler
bot.on(['document', 'photo', 'video', 'audio', 'voice', 'animation', 'sticker'], async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message;
  
  if (!checkRateLimit(userId)) {
    return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  }

  // ==========================================
  // CHECK: Is this part of Add Book session?
  // ==========================================
  if (addBookSessions[userId] && addBookSessions[userId].step === 'file') {
    const session = addBookSessions[userId];
    const fileInfo = extractFileInfo(message);
    
    if (!fileInfo) {
      return ctx.reply("❌ የፋይሉ መረጃ ሊገኝ አልቻለም። እባክዎትን ፋይሉን በቀጥታ ይላኩ።");
    }
    
    // Add the book
    const category = session.category;
    const books = booksDatabase[category];
    let maxId = 0;
    books.forEach(book => {
      const numId = parseInt(book.id);
      if (!isNaN(numId) && numId > maxId) maxId = numId;
    });
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
      `✅ **Book Added Successfully!** 📚\n\n` +
      `📂 **Category:** ${category}\n` +
      `🆔 **Book ID:** ${newId}\n` +
      `📄 **Title:** ${session.title}\n` +
      `🔑 **File ID:** ${fileInfo.fileId}\n` +
      `📝 **Preview:** ${session.preview.substring(0, 100)}...\n\n` +
      `📊 Total books in this category: ${booksDatabase[category].length}`,
      { parse_mode: 'Markdown' }
    );
    
    logActivity(userId, 'add_book', { category, bookId: newId, title: session.title });
    return;
  }

  // ==========================================
  // ADMIN: Get File ID - Handles ALL cases!
  // ==========================================
  if (isAdmin(userId)) {
    const isForwarded = message.forward_from_chat || message.forward_from;
    let fileInfo = extractFileInfo(message);
    
    if (fileInfo) {
      let forwardedNote = isForwarded ? '\n📤 **Forwarded File** - ID extracted successfully!' : '';
      
      // Send to all admins
      for (const adminId of ADMIN_IDS) {
        if (adminId !== userId) {
          await ctx.telegram.sendMessage(adminId, 
            `🔑 **Admin ${userId} got File ID**\n\n` +
            `📄 File: ${fileInfo.fileName}\n` +
            `🆔 ID: ${fileInfo.fileId}`
          );
        }
      }
      
      return ctx.reply(
        `🔑 **የፋይሉ ID ተዘጋጅቷል**\n\n` +
        `📄 **File Name:** \`${fileInfo.fileName}\`\n` +
        `🆔 **File ID:** \`${fileInfo.fileId}\`\n` +
        `📁 **File Type:** \`${fileInfo.type}\`\n` +
        `📋 **MIME Type:** \`${fileInfo.mimeType}\`\n` +
        `📦 **File Size:** \`${(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB\`\n` +
        `${forwardedNote}\n\n` +
        `✅ ይህንን File ID ኮፒ በማድረግ በ 'booksDatabase' ውስጥ በ 'file_id' ቦታ ማስገባት ይችላሉ።\n\n` +
        `📝 **ለመጠቀም መመሪያ:**\n` +
        `1️⃣ ከላይ ያለውን File ID ይቅዱ\n` +
        `2️⃣ በ booksDatabase ውስጥ ተገቢውን መጽሐፍ ይፈልጉ\n` +
        `3️⃣ የ 'file_id' እሴትን በተቀዳው ID ይቀይሩ\n\n` +
        `📌 **ወይም በቀላሉ ለመጨመር:**\n` +
        `• /addbook - Step by step guide\n` +
        `• Reply to this message with /addbookinteractive`,
        { parse_mode: 'Markdown' }
      );
    }
    
    if (isForwarded) {
      return ctx.reply(
        `⚠️ **ይህ የተላለፈ (Forwarded) ፋይል ነው!**\n\n` +
        `ከቻናል የተላለፈ ፋይል ላይ File ID ማግኘት አይቻልም።\n\n` +
        `✅ **መፍትሔዎች:**\n\n` +
        `**1️⃣ በቀጥታ ይላኩ (Recommended):**\n` +
        `   • ፋይሉን ያውርዱ (Download)\n` +
        `   • በቀጥታ ወደዚህ ቦት ይላኩ\n` +
        `   • File ID ያገኛሉ\n\n` +
        `**2️⃣ @get_id_bot ይጠቀሙ:**\n` +
        `   • ፋይሉን ወደ @get_id_bot ያስተላልፉ\n` +
        `   • File ID ይሰጥዎታል\n\n` +
        `**3️⃣ /getfileid ትዕዛዝ ይጠቀሙ:**\n` +
        `   • ፋይሉን ወደዚህ ቦት ያስተላልፉ\n` +
        `   • በፋይሉ ላይ /getfileid ይላኩ (Reply)`,
        { parse_mode: 'Markdown' }
      );
    }
    
    return ctx.reply("⚠️ የፋይሉ መረጃ ሊገኝ አልቻለም። እባክዎን ፋይሉን በቀጥታ ይላኩ።");
  }

  // ==========================================
  // For NON-ADMIN users: Receipt validation
  // ==========================================
  
  // Check if user already paid
  if (isPaidUser(userId)) {
    try { await ctx.deleteMessage(); } catch (err) {}
    return ctx.reply("✅ እርስዎ ቀደም ሲል ክፍያ ፈጽመዋል። ተጨማሪ ሪሲት መላክ አያስፈልግዎትም።");
  }

  // Extract file info
  const fileInfo = extractFileInfo(message);
  
  if (!fileInfo) {
    try { await ctx.deleteMessage(); } catch (err) {}
    return ctx.reply("⚠️ እባክዎን ትክክለኛ የባንክ ሪሲት ይላኩ።");
  }

  // Validate receipt
  const caption = message.caption || "";
  const validation = validateBankReceipt(caption, fileInfo.fileName, fileInfo.type);

  if (!validation.isValid) {
    try { await ctx.deleteMessage(); } catch (err) {}
    return ctx.reply(
      `❌ ይህ የባንክ ሪሲት አይደለም!\n\n` +
      `እባክዎትን የከፈሉበትን ትክክለኛ ሪሲት ይላኩ።`
    );
  }

  // Process valid receipt
  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    const forwardedMsg = await ctx.telegram.forwardMessage(
      ADMIN_IDS[0],
      ctx.chat.id,
      message.message_id
    );

    db.pendingReceipts[forwardedMsg.message_id] = {
      userId: userId,
      orderNumber: orderNumber,
      confidence: validation.confidence
    };
    saveDatabase();

    // Notify all admins
    for (const adminId of ADMIN_IDS) {
      await ctx.telegram.sendMessage(
        adminId,
        `📥 **አዲስ ሪሲት**\n\n` +
        `🧾 Order: #${orderNumber}\n` +
        `👤 User: ${userId}\n` +
        `👤 Username: @${ctx.from.username || 'የለውም'}\n` +
        `✅ Confidence: ${validation.confidence}%\n` +
        `📋 ${validation.reasons}`,
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
    }

    ctx.reply(
      `✅ ሪሲትዎ ተረጋግጧል!\n\n` +
      `🧾 Order: #${orderNumber}\n` +
      `📊 Confidence: ${validation.confidence}%\n\n` +
      `አድሚኑ በጥቂት ደቂቃዎች ውስጥ ያጸድቀዋል!`
    );
    
    logActivity(userId, 'receipt_submitted', { orderNumber, confidence: validation.confidence });
    
  } catch (error) {
    console.error('Error:', error);
    ctx.reply("⚠️ ሪሲትዎን ማስኬድ አልቻልኩም። እባክዎን በቀጥታ ወደ አድሚን ይላኩ።");
  }
});

// ==========================================
// 13. GET FILE ID COMMAND
// ==========================================
bot.command('getfileid', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    return ctx.reply("⚠️ ይህ ትዕዛዝ ለአድሚን ብቻ ነው!");
  }
  
  const reply = ctx.message.reply_to_message;
  
  if (!reply) {
    return ctx.reply(
      `⚠️ **እባክዎትን ፋይሉን ለዚህ መልእክት ይላኩ!**\n\n` +
      `📌 **አጠቃቀም:**\n` +
      `1️⃣ ፋይሉን ወደዚህ ቦት ያስተላልፉ (Forward)\n` +
      `2️⃣ በተላለፈው ፋይል ላይ /getfileid ይላኩ (Reply)\n` +
      `3️⃣ File ID ያገኛሉ!`,
      { parse_mode: 'Markdown' }
    );
  }
  
  let fileId = null;
  let fileName = '';
  let fileType = '';
  
  if (reply.document) {
    fileId = reply.document.file_id;
    fileName = reply.document.file_name || 'Document.pdf';
    fileType = 'document';
  } else if (reply.photo && reply.photo.length > 0) {
    const photo = reply.photo[reply.photo.length - 1];
    fileId = photo.file_id;
    fileName = 'Photo.jpg';
    fileType = 'photo';
  } else if (reply.video) {
    fileId = reply.video.file_id;
    fileName = reply.video.file_name || 'Video.mp4';
    fileType = 'video';
  } else if (reply.audio) {
    fileId = reply.audio.file_id;
    fileName = reply.audio.file_name || 'Audio.mp3';
    fileType = 'audio';
  } else if (reply.voice) {
    fileId = reply.voice.file_id;
    fileName = 'Voice.ogg';
    fileType = 'voice';
  } else if (reply.animation) {
    fileId = reply.animation.file_id;
    fileName = 'Animation.gif';
    fileType = 'animation';
  } else if (reply.sticker) {
    fileId = reply.sticker.file_id;
    fileName = 'Sticker.webp';
    fileType = 'sticker';
  }
  
  if (fileId) {
    const isForwarded = reply.forward_from_chat || reply.forward_from;
    let forwardedNote = isForwarded ? '📤 **Forwarded File** - ID extracted successfully!' : '';
    
    ctx.reply(
      `🔑 **File ID ተገኝቷል!**\n\n` +
      `📄 **File Name:** \`${fileName}\`\n` +
      `🆔 **File ID:** \`${fileId}\`\n` +
      `📁 **File Type:** \`${fileType}\`\n` +
      `${forwardedNote}\n\n` +
      `✅ ይህንን File ID ኮፒ በማድረግ በ 'booksDatabase' ውስጥ በ 'file_id' ቦታ ማስገባት ይችላሉ።`,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.reply(
      `⚠️ ይህ መልእክት ፋይል የለውም!\n\n` +
      `📌 እባክዎትን ፋይል ያለው መልእክት ላይ Reply ያድርጉ።`
    );
  }
});

// ==========================================
// 14. HELP COMMAND
// ==========================================
bot.command('help', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  
  ctx.reply(
    `📚 **Bot Commands & Help**\n\n` +
    `**📁 Getting File ID:**\n` +
    `1️⃣ Send file directly → Auto shows ID\n` +
    `2️⃣ Forward file → Reply with /getfileid\n` +
    `3️⃣ Use @get_id_bot for any file\n\n` +
    `**📚 Adding Books:**\n` +
    `• /addbook - Step by step guide\n` +
    `• /categories - List all categories\n` +
    `• /canceladd - Cancel adding book\n\n` +
    `**🔧 Admin Commands:**\n` +
    `• /stats - View bot statistics\n` +
    `• /getfileid - Get ID from replied file\n` +
    `• /backup - Download database backup\n` +
    `• /downloaddb - Download database file\n` +
    `• /help - Show this help\n\n` +
    `**📚 Book Categories:**\n` +
    `• Ge'ez: Law, History, Bible\n` +
    `• Ge'ez-Amharic: All categories\n` +
    `• Amharic: All categories\n` +
    `• English: All categories\n\n` +
    `**👤 User Commands:**\n` +
    `• 📊 My Stats - View your statistics\n` +
    `• 📚 መጽሐፍት - Browse books\n` +
    `• 🔍 መጽሐፍ ፈልግ - Search books\n` +
    `• 📞 Contact Me - Contact admin\n` +
    `• 💬 Feedback - Send feedback`,
    { parse_mode: 'Markdown' }
  );
});

// ==========================================
// 15. ADMIN COMMANDS
// ==========================================
bot.command('stats', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  const totalUsers = Object.keys(db.users).length;
  const paidUsers = Object.values(db.users).filter(u => u.is_paid).length;
  const freeUsers = totalUsers - paidUsers;
  
  // Calculate total downloads
  let totalDownloads = 0;
  Object.values(db.users).forEach(user => {
    totalDownloads += user.total_downloads || 0;
  });

  // Get book stats
  let bookStats = '';
  if (db.bookStats) {
    const topBooks = Object.entries(db.bookStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (topBooks.length > 0) {
      bookStats = '\n\n📚 **Top 5 Books Downloaded:**\n';
      topBooks.forEach(([key, count], index) => {
        const [catKey, bookId] = key.split('_');
        const book = findBook(catKey, bookId);
        bookStats += `${index + 1}. ${book ? book.title : key} - ${count} downloads\n`;
      });
    }
  }

  ctx.reply(
    `📊 **Bot Statistics**\n\n` +
    `👤 **Total Users:** ${totalUsers}\n` +
    `💰 **Paid Users:** ${paidUsers}\n` +
    `📖 **Free Users:** ${freeUsers}\n` +
    `📚 **Total Downloads:** ${totalDownloads}\n` +
    `📁 **Books Available:** ${Object.values(booksDatabase).reduce((sum, cat) => sum + cat.length, 0)}\n` +
    `📅 **Users Registered Today:** ${Object.values(db.users).filter(u => new Date(u.registration_date).toDateString() === new Date().toDateString()).length}\n` +
    `${bookStats}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('backup', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  const backupData = JSON.stringify(db, null, 2);
  ctx.replyWithDocument({
    source: Buffer.from(backupData, 'utf-8'),
    filename: `backup_${Date.now()}.json`
  }, { caption: "📦 የዳታቤዝ ባካፕ ፋይል" });
});

bot.command('downloaddb', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  
  if (fs.existsSync(DATA_FILE)) {
    ctx.replyWithDocument({
      source: DATA_FILE,
      filename: `database_${Date.now()}.json`
    }, { caption: "📦 የዳታቤዝ ፋይል" });
  } else {
    ctx.reply("❌ የዳታቤዝ ፋይል አልተገኘም");
  }
});

bot.command('categories', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  
  let categoryList = '📂 **Available Categories:**\n\n';
  Object.keys(booksDatabase).forEach(cat => {
    const count = booksDatabase[cat].length;
    categoryList += `• \`${cat}\` - ${count} books\n`;
  });
  
  ctx.reply(categoryList, { parse_mode: 'Markdown' });
});

// ==========================================
// 16. ADMIN ACTIONS
// ==========================================
bot.action(/^approve_(\d+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return ctx.answerCbQuery("⛔ ይህ ለአድሚን ብቻ ነው!", { show_alert: true });
  }
  
  const targetUserId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];

  markUserPaid(targetUserId);

  ctx.telegram.sendMessage(
    targetUserId,
    `✅ ክፍያ #${orderNumber} ተቀባይነት አግኝቷል! 🎉\n\n` +
    `ከአሁን በኋላ ሁሉንም መጽሐፍት ማውረድ ይችላሉ። 📚✨\n\n` +
    `🙏 እግዚአብሔር ይባርክህ!`
  );

  ctx.editMessageText(`✅ ክፍያ #${orderNumber} ጸድቋል (User: ${targetUserId})`);
  
  logActivity(targetUserId, 'payment_approved_by_admin', { adminId: userId, orderNumber });
});

bot.action(/^reject_(\d+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    return ctx.answerCbQuery("⛔ ይህ ለአድሚን ብቻ ነው!", { show_alert: true });
  }
  
  const targetUserId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];

  ctx.telegram.sendMessage(
    targetUserId,
    `❌ ክፍያ #${orderNumber} ውድቅ ተደርጓል።\n\n` +
    `እባክዎትን ትክክለኛ ያልተደገመ ሪሲት ይላኩ።`
  );

  ctx.editMessageText(`❌ ክፍያ #${orderNumber} ውድቅ ተደርጓል (User: ${targetUserId})`);
  
  logActivity(targetUserId, 'payment_rejected_by_admin', { adminId: userId, orderNumber });
});

// ==========================================
// 17. COMMANDS & MAIN MENU
// ==========================================
bot.start((ctx) => {
  const userId = ctx.from.id;
  
  // Check rate limit
  if (!checkRateLimit(userId)) {
    return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ! በደቂቃ ከ30 በላይ ጥያቄ መላክ አይቻልም።");
  }
  
  const isNew = registerUser(ctx.from);
  
  // Check if user has preferred language
  const user = db.users[userId];
  let welcomeMessage = "እንኳን ወደ ታላቁ ዲጂታል መጽሐፍ ቦት በሰላም መጡ! 📚✨\n\n";
  
  if (isNew) {
    welcomeMessage += "🙏 ይህ ቦት የኦርቶዶክስ መንፈሳዊ መጽሐፍትን በዲጂታል መልክ ያቀርባል።\n";
    welcomeMessage += "📖 ከ100 በላይ መጽሐፍት በግዕዝ፣ በአማርኛ እና በእንግሊዝኛ ይገኛሉ።\n\n";
    welcomeMessage += "💡 መጀመሪያ '📚 መጽሐፍት' በመጫን መጽሐፎችን ይመልከቱ!";
  } else {
    welcomeMessage += `👋 እንኳን ደህና መጡ ${user.username || 'ውድ ተጠቃሚ'}!\n`;
    if (user.is_paid) {
      welcomeMessage += "✅ እርስዎ ክፍያ ፈጽመዋል! ሁሉንም መጽሐፍት ማውረድ ይችላሉ።\n";
    } else {
      welcomeMessage += "💰 ሁሉንም መጽሐፍት ለማግኘት 200 ብር ክፈሉ።\n";
    }
    welcomeMessage += `📚 እስካሁን ${user.total_downloads || 0} መጽሐፍት አውርደዋል።`;
  }
  
  ctx.reply(welcomeMessage, mainKeyboard);
  logActivity(userId, 'start', { isNew });
});

bot.hears('🔄 Start', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ! በደቂቃ ከ30 በላይ ጥያቄ መላክ አይቻልም።");
  }
  registerUser(ctx.from);
  ctx.reply("እንኳን ወደ ታላቁ የዲጂታል መጽሐፍ ቦት በሰላም መጡ", mainKeyboard);
});

bot.hears('📞 Contact Me', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  
  ctx.reply(`📞 ለተጨማሪ መረጃ እና ግንኙነት፦\n\n• Telegram: ${ADMIN_USERNAME}\n• Email: matewosgetahunseifu@gmail.com`);
});

bot.hears('💬 Feedback', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  
  ctx.reply(`💬 አስተያየትዎን ያድርሱን፦\n\nለማንኛውም ጥያቄ፣ አስተያየት ወይም ተጨማሪ መጽሐፍ ጥቆማ በቴሌግራም አድራሻችን ያግኙን፦\n\n• Telegram: ${ADMIN_USERNAME}\n• Email: matewosgetahunseifu@gmail.com`);
});

bot.hears('📚 መጽሐፍት', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  
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
// 18. CATEGORY ROUTING
// ==========================================
bot.action("lang_geez", (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  // Save preferred language
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez";
    saveDatabase();
  }
  
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
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  // Save preferred language
  if (db.users[userId]) {
    db.users[userId].preferred_language = "geez_amharic";
    saveDatabase();
  }
  
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
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  // Save preferred language
  if (db.users[userId]) {
    db.users[userId].preferred_language = "amharic";
    saveDatabase();
  }
  
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
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ Please wait a moment!", { show_alert: true });
  }
  
  // Save preferred language
  if (db.users[userId]) {
    db.users[userId].preferred_language = "english";
    saveDatabase();
  }
  
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
// 19. BOOK DISPLAY & DELIVERY
// ==========================================
bot.action(/^cat_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
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

// Book selection handler with preview
bot.action(/^gb_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];

  const book = findBook(catKey, bookId);

  if (!book) {
    return ctx.answerCbQuery("መጽሐፉ አልተገኘም።", { show_alert: true });
  }

  if (!isPaidUser(userId)) {
    // Show payment screen with preview
    return ctx.reply(
      `📖 **${book.title}**\n\n` +
      `📄 **Preview (${PREVIEW_PAGES} pages):**\n${book.preview || 'Preview not available'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 **የኦርቶዶክስ መንፈሳዊ መጽሐፍት**\n\n` +
      `ሁሉንም የመጽሐፍ ዓይነቶች ሙሉ በሙሉ ለመጠቀም **200 ብር** አንድ ጊዜ ብቻ ይክፈሉ።\n\n` +
      `💳 የክፍያ መንገዶች፦\n` +
      `• አሐዱ ባንክ፦ 0100775011101\n` +
      `• የኢትዮጵያ ንግድ ባንክ (CBE)፦ 1000661046841\n` +
      `• አቢሲንያ ባንክ፦ 57080698\n` +
      `• ቴሌብር (Telebirr)፦ 0943910036\n\n` +
      `👤 የአካውንት ስም፦ Matewos Getahun Seifu\n\n` +
      `📸 ክፍያ እንደፈጸሙ የባንክ ሪሲት ወደዚህ ቦት ይላኩ።\n` +
      `━━━━━━━━━━━━━━━━━━━━━`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback("📖 Read Full Book", `pay_${catKey}_${bookId}`)],
          [Markup.button.callback("👁 More Preview", `preview_${catKey}_${bookId}`)]
        ])
      }
    );
  }

  // If paid, send the book
  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨\n\n🙏 ይህ መጽሐፍ የመጠበቅ መብቱ የተጠበቀ ነው።`,
    protect_content: true
  }).then(() => {
    // Track download
    trackDownload(userId, catKey, bookId);
  }).catch((error) => {
    console.error('Error sending book:', error);
    ctx.reply(
      `❌ የመጽሐፉ ስም፦ ${book.title}\n(ፋይሉ አልተገኘም)\n\n` +
      `🔄 እባክዎትን እንደገና ይሞክሩ።`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Retry", `retry_${catKey}_${bookId}`)]
      ])
    );
    logActivity(userId, 'download_failed', { catKey, bookId, error: error.message });
  });
});

// Retry handler
bot.action(/^retry_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);

  if (!book) {
    return ctx.reply("❌ መጽሐፉ አልተገኘም።");
  }

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ! 📚✨`,
    protect_content: true
  }).then(() => {
    trackDownload(userId, catKey, bookId);
    ctx.reply("✅ መጽሐፉ በተሳካ ሁኔታ ተላከ!");
  }).catch(() => {
    ctx.reply(`❌ እንደገና አልተሳካም። እባክዎትን በኋላ ይሞክሩ።`);
  });
});

// Preview handler
bot.action(/^preview_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);

  if (!book) {
    return ctx.reply("❌ መጽሐፉ አልተገኘም።");
  }

  // Send preview text (simulate pages 1-25)
  let previewText = `📖 **${book.title}**\n\n`;
  previewText += `📄 **Preview (Pages 1-${PREVIEW_PAGES}):**\n\n`;
  
  // Generate preview content
  for (let i = 1; i <= Math.min(PREVIEW_PAGES, 10); i++) {
    previewText += `📄 **Page ${i}:**\n`;
    previewText += `${book.preview || 'This page contains spiritual teachings...'}\n\n`;
  }
  
  previewText += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  previewText += `🔒 ሙሉውን መጽሐፍ ለማንበብ ክፍያ ይፈጽሙ።\n`;
  previewText += `━━━━━━━━━━━━━━━━━━━━━`;

  ctx.reply(previewText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📖 Read Full Book", `pay_${catKey}_${bookId}`)],
      [Markup.button.callback("⬅️ Go Back", `gb_${catKey}_${bookId}`)]
    ])
  });
});

// Payment button - redirects to book selection with payment screen
bot.action(/^pay_(.+)_(.+)$/, (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) {
    return ctx.answerCbQuery("⏳ እባክዎትን ትንሽ ይጠብቁ!", { show_alert: true });
  }
  
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const book = findBook(catKey, bookId);

  if (!book) {
    return ctx.reply("❌ መጽሐፉ አልተገኘም።");
  }

  // Show payment details again
  ctx.reply(
    `📖 **${book.title}**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 **የኦርቶዶክስ መንፈሳዊ መጽሐፍት**\n\n` +
    `ሁሉንም የመጽሐፍ ዓይነቶች ሙሉ በሙሉ ለመጠቀም **200 ብር** አንድ ጊዜ ብቻ ይክፈሉ።\n\n` +
    `💳 የክፍያ መንገዶች፦\n` +
    `• አሐዱ ባንክ፦ 0100775011101\n` +
    `• የኢትዮጵያ ንግድ ባንክ (CBE)፦ 1000661046841\n` +
    `• አቢሲንያ ባንክ፦ 57080698\n` +
    `• ቴሌብር (Telebirr)፦ 0943910036\n\n` +
    `👤 የአካውንት ስም፦ Matewos Getahun Seifu\n\n` +
    `📸 ክፍያ እንደፈጸሙ የባንክ ሪሲት ወደዚህ ቦት ይላኩ።\n` +
    `━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("👁 View Preview Again", `preview_${catKey}_${bookId}`)],
        [Markup.button.callback("📚 Browse More Books", `cat_${catKey}`)]
      ])
    }
  );
});

// ==========================================
// 20. SEARCH
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  
  ctx.reply("🔍 እባክዎን ማንበብ የሚፈልጉትን የመጽሐፍ ስም ወይም ቁልፍ ቃል ያስገቡ፦");
});

bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  if (['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ', '📞 Contact Me', '💬 Feedback', '📊 My Stats', '🔄 Start'].includes(text) || text.startsWith('/')) {
    return;
  }

  if (!checkRateLimit(userId)) {
    return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ! በደቂቃ ከ30 በላይ ጥያቄ መላክ አይቻልም።");
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
    return ctx.reply(`🔍 ምንም መጽሐፍ አልተገኘም "${text}"\n\n💡 እባክዎትን የቃሉን አጻጻፍ አስተካክለው ይሞክሩ።`);
  }

  const buttons = matches.slice(0, 20).map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.catKey}_${book.id}`)
  ]);

  ctx.reply(
    `🔍 ውጤቶች (${matches.length} ተገኝተዋል)${matches.length > 20 ? ' - የመጀመሪያ 20 እያሳይ ነው' : ''}፦`,
    Markup.inlineKeyboard(buttons)
  );
  
  logActivity(userId, 'search', { query, results: matches.length });
});

// ==========================================
// 21. USER STATS
// ==========================================
bot.hears('📊 My Stats', (ctx) => {
  const userId = ctx.from.id;
  if (!checkRateLimit(userId)) return ctx.reply("⏳ እባክዎትን ትንሽ ይጠብቁ!");
  
  const stats = getUserStats(userId);
  if (!stats) {
    return ctx.reply("❌ የእርስዎ መረጃ አልተገኘም።");
  }
  
  const status = stats.is_paid ? "✅ ክፍያ ፈጽመዋል" : "❌ ክፍያ አልፈጸሙም";
  
  ctx.reply(
    `📊 **የእርስዎ ስታቲስቲክስ**\n\n` +
    `👤 **Username:** ${stats.username}\n` +
    `💰 **Status:** ${status}\n` +
    `📅 **Registered:** ${new Date(stats.registration_date).toLocaleDateString()}\n` +
    `📚 **Books Downloaded:** ${stats.total_downloads}\n` +
    `📖 **Unique Books:** ${stats.books_downloaded}\n` +
    `🌍 **Preferred Language:** ${stats.preferred_language}\n\n` +
    `💡 ተጨማሪ መጽሐፍትን ለማውረድ '📚 መጽሐፍት' ይጫኑ!`,
    { parse_mode: 'Markdown' }
  );
});

// ==========================================
// 22. LAUNCH
// ==========================================
bot.catch((err, ctx) => {
  console.error(`❌ Error:`, err);
  logError('bot_catch', err);
  if (ctx) {
    ctx.reply("⚠️ የሆነ ችግር ተፈጥሯል። እባክዎትን በኋላ ይሞክሩ።").catch(() => {});
  }
});

bot.launch({
  dropPendingUpdates: true
}).then(() => {
  console.log("✅ Bot is running...");
  console.log("📚 Orthodox Spiritual Books Bot is ready!");
  console.log("👑 Admin IDs:", ADMIN_IDS);
  console.log(`📁 Data file: ${DATA_FILE}`);
  console.log(`📖 Total Books: ${Object.values(booksDatabase).reduce((sum, cat) => sum + cat.length, 0)}`);
}).catch((err) => {
  console.error("❌ Failed to launch:", err);
});

process.once('SIGINT', () => {
  saveDatabase();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  saveDatabase();
  bot.stop('SIGTERM');
});