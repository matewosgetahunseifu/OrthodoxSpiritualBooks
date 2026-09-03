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
  
  
  
  //ሕግና ሥርዓት 
  
  
  
  "geez_law": [
    { id: "1", file_id: "DUMMY_GEEZ_LAW_01", title: "ርትዐ ነገሥት (ግዕዝ)" },
    { id: "2", file_id: "DUMMY_GEEZ_LAW_02", title: "ፍትሐ ነገሥት (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_LAW_03", title: "ሥርዓተ ቤተ ክርስቲያን (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_LAW_04", title: "መጽሐፈ ዲደስቅልያ (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_LAW_05", title: "ቃኖናዊ መጻሕፍት (ግዕዝ)" }
  ],
  
  
  //ግእዝ ታሪክ 
  
  
  
  "geez_hist": [
    { id: "1", file_id: "DUMMY_GEEZ_HIST_01", title: "ዜና አይሁድ (ግዕዝ)" },
    { id: "2", file_id: "DUMMY_GEEZ_HIST_02", title: "መጽሐፈ አክሱም (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_HIST_03", title: "ታሪከ ነገሥት (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_HIST_04", title: "ዜና እስክንድር (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_HIST_05", title: "መጽሐፈ ሱባኤ (ግዕዝ)" }
  ],
  
  
  //ግእዝ ገድል ድርሳንና ተአምር
  
  
  
  "geez_gdsl": [
    { id: "1", file_id: "BQACAgQAAxkBAAPZapjWdXjCEeNoOjlRMK0G6pX6Bk0AAj8KAAL6HClRQKqGVFXiKK49BA", title: "ድርሳነ ሚካኤል ብራና" },
    { id: "2", file_id: "BQACAgQAAxkBAAPfapjXcgpreKHIrBgNQGEua7HCmTkAAjwKAAJ9PIlTM8CfaZvR-2k9BA", title: "ድርሳነ ሰብዓቱ መላእክት " },
    { id: "3", file_id: "BQACAgQAAxkBAAPhapjZBSJoVscB4rjwsfDWbSwHxoAAoEWAAIMhmhQkIh7mGtt3K09BA", title: "ድርሳነሊ ገብርኤል ብራና" },
    { id: "4", file_id: "BQACAgQAAxkBAAPjapjZhdpHFvYDvcFIkczDUW9tLIAAlMdAAKS69FTbBiiXs-zys9BA", title: "ድርሳነ ሚካኤል ብራና" },
    {
      id:"5",file_id:"BQACAgQAAxkBAAPqapjbmRP3A_QVTyhXBZWLS5TjLGoAAtgNAAJtwMBTHiiUSHg9EAY9BA",title:"ድርሳነ ገብርኤል"
    },
    {id:"6", file_id:"BQACAgQAAxkBAAIBDGqY_SozbC0I2Fi7ge5kQMckNxwqAAJ5FQACjWfpUmi2j5U2zN51PQQ", title:"ድርሳን ዘነገሮሙ እግዚእነ ለሐዋርያት "
      {
        id:"7", file_id:"BQACAgQAAxkBAAIBDmqY_dtm16Rhp9jSESjwVhCdAaznAAIsDgACEtFpUV-I4u72ln7CPQQ",title:"ድርሳነ ቅዱስ ሩፋኤል"
      },
     {
       id:"8",file_id:"BQACAgEAAxkBAAIBEGqY_us4NhTLt8P2KJX-VWtR4TraAAJRAgACYHfoRvu7BfQqD_cVPQQ", title:"ድርሳነ ማሕየዊ ምስለ መልክዑ"
     },
    { id: "∞", file_id: "DUMMY_GEEZ_GDSL_05", title: "We add soon/በቅርቡ እንጨምራለን" }
  ],
  
  
  //ግእዝ ብሉይ ኪዳን
  
  
  
  "geez_ot": [
    { id: "1", file_id: "BQACAgQAAxkBAAMYapd7UbkpzfZTIng9daYvw8A1q-4AAn0JAAIWA9hQw4UxsdCUEow9BA", title: "፭ቱ መጽሐፍተ ኦሪት ብራና ትርጓሜ " },
    { id: "2", file_id: "DUMMY_GEEZ_OT_02", title: "ኦሪት ዘጸአት (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_OT_03", title: "መጽሐፈ መዝሙር (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_OT_04", title: "መጽሐፈ ኢሳይያስ (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_OT_05", title: "መጽሐፈ ምሳሌ (ግዕዝ)" }
  ],
  
  
  //ግእዝ ሐዲስ ኪዳን
  
  
  
  "geez_nt": [
    { id: "1", file_id: "BQACAgQAAxkBAAMaapd8piiIyiFFa_-dYnnKkqU2RgcAAgMeAALIlMFT0Y7m-S1fk-I9BA", title: "ሙሉው ሐዲስ ኪዳን የጸዳ(ሚነበብ) ብራና" },
    { id: "2", file_id: "DUMMY_GEEZ_NT_02", title: "ወንጌል ዘዮሐንስ (ግዕዝ)" },
    { id: "3", file_id: "DUMMY_GEEZ_NT_03", title: "ግብረ ሐዋርያት (ግዕዝ)" },
    { id: "4", file_id: "DUMMY_GEEZ_NT_04", title: "መልእክተ ጳውሎስ (ግዕዝ)" },
    { id: "5", file_id: "DUMMY_GEEZ_NT_05", title: "ራእየ ዮሐንስ (ግዕዝ)" }
  ],

  // --- 3.2. በግዕዝ አማርኛ ---
  
  
  //ሕግ እና ሥርዓት 
  
  
  
  "ga_law": [
    { id: "1", file_id: "DUMMY_GA_LAW_01", title: "ፍትሐ ነገሥት ንባቡና ትርጓሜው" },
    { id: "2", file_id: "DUMMY_GA_LAW_02", title: "ሥርዓተ ቤተ ክርስቲያን ትርጓሜ" },
    { id: "3", file_id: "DUMMY_GA_LAW_03", title: "መጽሐፈ ዲደስቅልያ ትርጓሜ" },
    { id: "4", file_id: "DUMMY_GA_LAW_04", title: "ቃኖና ቤተ ክርስቲያን" },
    { id: "5", file_id: "DUMMY_GA_LAW_05", title: "መጽሐፈ ቅዳሴ ንባቡና ትርጓሜው" }
  ],
  
  
  //ግእዝ አማርኛ ታሪክ
  
  
  
  "ga_hist": [
    { id: "1", file_id: "DUMMY_GA_HIST_01", title: "ዜና አይሁድ ትርጓሜ" },
    { id: "2", file_id: "DUMMY_GA_HIST_02", title: "መጽሐፈ አክሱም ትርጓሜ" },
    { id: "3", file_id: "DUMMY_GA_HIST_03", title: "ታሪከ ነገሥት ዘኢትዮጵያ" },
    { id: "4", file_id: "DUMMY_GA_HIST_04", title: "ዜና እስክንድር ትርጓሜ" },
    { id: "5", file_id: "DUMMY_GA_HIST_05", title: "መጽሐፈ ሱባኤ ትርጓሜ" }
  ],
  
  
  //ግእዝ አማርኛ ገድል
  
  
  
  "ga_gdsl": [
    { id: "1", file_id: "BQACAgQAAxkBAAPWaphINHM2lRkznNEzSJovZdpcrzwAApMdAALp9MhQlhG908oUFio9BA", title: "ድርሳነ ሚካኤል" },
    { id: "2", file_id: "BQACAgQAAxkBAAP0apjiCWvVv63N4thgtKqSSSTG9mAAAtUhAAKuXclQxitdVaULcDM9BA", title: "ድርሳነ ራጉኤል" },
    { id: "3", file_id: "BQACAgQAAxkBAAPoapjbcyXFg9F4CFUuWjj1-LTQ1OEAAv8WAAK4B1FQGnav1e-AgJc9BA", title: "ድርሳነ ሰንበት" },
    { id: "4", file_id: "BQACAgQAAxkBAAP-apjsYNMJPvsbCSIwvSEftWz1Or8AAtUaAAIiroFRnGC9dtNUZi89BA", title: "ድርሳነ ዑራኤል" },
    { id: "5", file_id: "BQACAgQAAxkBAAIBCmqY_KO_j0lGIMgcf-0leltOH1hNAAJ1FAAC45BxUwH6hyap6vD1PQQ", title: "ድርሳነ_መድኃኔ_ዓለም_ገድለ_አቡነ_መባዓ_ጽዮን" },
    {
      id:"6", file_id:"BQACAgQAAxkBAAIBFGqY_9c_xTeW1Ox68xksvGHi6qRXAAK1GQACBzpJU7ddXZ-PfJNrPQQ", title:"ድርሳነ ዜና ሥላሴ"
    },
    
    
    {
      id:"∞", file_id:"ghhguuug",title:"we add soon/በቅርቡ ችንጨምራለን"
    }
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
    { id: "5", file_id: "BQACAgQAAxkBAAOBape555kx5chgTM0HuqJivR3bDuQAAg0YAALB61hQCIYaj31GHiw9BA", title: "የሐዋርያት ሥራ ትርጓሜ" },
    { id: "6", file_id: "BQACAgQAAxkBAAODape9bjU5mP1luEgC_j0DZ7whg_kAAowYAAI1KphTzq16eyFGTF89BA", title: "ሮሜ አንድምታ ትርጓሜ" },
    { id: "7", file_id: "BQACAgQAAxkBAAOFape-Oj3cIsSv4xdiAoptKykB7gAD7yAAAlx_WVMPRIXfrWJIhT0E", title: "ወደ ሮሜ ንባቡና ትርጓሜ" }
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
  
  
  //አማርኛ ሕግና ሥርዓት 
  
  
  
  "amh_law": [
    { id: "1", file_id: "DUMMY_AMH_LAW_01", title: "የቤተ ክርስቲያን ሕግና ሥርዓት" },
    { id: "2", file_id: "DUMMY_AMH_LAW_02", title: "የሥርዓተ ቅዳሴ ማብራሪያ" },
    { id: "3", file_id: "DUMMY_AMH_LAW_03", title: "የክርስቲያን ሕይወትና ሥርዓት" },
    { id: "4", file_id: "DUMMY_AMH_LAW_04", title: "የፍትሐ ነገሥት ማብራሪያ" },
    { id: "5", file_id: "DUMMY_AMH_LAW_05", title: "የቅዱሳት ምስጢራት ሥርዓት" }
  ],
  
  
  //አማርኛ ትስሪክ
  
  
  
  "amh_hist": [
    { id: "1", file_id: "DUMMY_AMH_HIST_01", title: "የኢትዮጵያ ቤተ ክርስቲያን ታሪክ" },
    { id: "2", file_id: "DUMMY_AMH_HIST_02", title: "የዓለም ቤተ ክርስቲያን ታሪክ" },
    { id: "3", file_id: "DUMMY_AMH_HIST_03", title: "የታሪከ ነገሥት ማጠቃለያ" },
    { id: "4", file_id: "DUMMY_AMH_HIST_04", title: "የቅዱሳን አበው ታሪክ" },
    { id: "5", file_id: "DUMMY_AMH_HIST_05", title: "የዜና መዋዕል ታሪክ" }
  ],
  
  
  //አማርኛ ድርሳን ገድል እና ተአምር
  
  
  
  "amh_gdsl": [
    { id: "1", file_id: "BQACAgQAAxkBAAIBEmqY_2wbgWxZz0w-DWy5K9vxVTh9AALXDgACKQABkFG92rcZN_zt1j0E", title: "የማኅበረ መላእክት ድርሳን" },
    { id: "2", file_id: "BQACAgQAAxkBAAPmapjaUtdihEG1XhcgCcLy7b5BI0AAtEhAAKuXclQ9tP3te9qdCs9BA", title: "ድርሳነ ፋኑኤል" },
    { id: "3", file_id: "BQACAgQAAxkBAAPaapjWdaw1Ga6g7FxtNE60cof2XMIAAncaAAKoDpFTQGuC3QGlKiU9BA", title: "ድርሳነ ገብርኤል" },
    { id: "4", file_id: "BQACAgQAAxkBAAPdapjXFTvN6JURihRCBgMWvp-FMiwAAlMOAAJ-QsFTMzSaI8GVtj49BA", title: "ድርሳነ ማሕየዊ" },
    { id: "∞", file_id: "DUMMY_AMH_GDSL_05", title: "We add son/በቅርቡ እንጨምራለን" }
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

// ==========================================
// 5. RECEIPT VALIDATION
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

const mainKeyboard = Markup.keyboard([
  ['📚 መጽሐፍት', '🔍 መጽሐፍ ፈልግ'],
  ['📞 Contact Me', '💬 Feedback'],
  ['🔄 Start']
]).resize();

// ==========================================
// 6. COMMANDS & MAIN MENU
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
// 7. CATEGORY ROUTING
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
// 8. BOOK DISPLAY & DELIVERY
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
      `የኦርቶዶክስ መንፈሳዊ መጽሐፍት\n\nሁሉንም የመጽሐፍ ዓይነቶች ሙሉ በሙሉ ለመጠቀም 200 ብር አንድ ጊዜ ብቻ ይክፈሉ።\n\n💳 የክፍያ መንገዶች፦\n• አሐዱ ባንክ፦ 0100775011101\n• የኢትዮጵያ ንግድ ባንክ (CBE)፦ 1000661046841\n• አቢሲንያ ባንክ፦ 57080698\n• ቴሌብር (Telebirr)፦ 0943910036\n\n👤 የአካውንት ስም፦ Matewos Getahun Seifu\n\nክፍያ እንደፈጸሙ የባንክ ሪሲት ወደዚህ ቦት ይላኩ።`,
      Markup.inlineKeyboard([
        [Markup.button.callback("👁 ቅምሻ / Preview", `prev_${catKey}_${bookId}`)]
      ])
    );
  }

  ctx.replyWithDocument(book.file_id, {
    caption: `📖 ${book.title}\n\nመልካም ንባብ!`,
    protect_content: true
  }).catch(() => {
    ctx.reply(`📖 የመጽሐፉ ስም፦ ${book.title}\n(ፋይሉ አልተገኘም)`);
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
// 9. FILE HANDLER - COMPLETE SOLUTION FOR ALL CASES
// ==========================================

// Helper function to extract file info from ANY message
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
    return {
      type: 'photo',
      fileId: photo.file_id,
      fileName: 'Photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: photo.file_size || 0
    };
  }
  if (msg.video) {
    return {
      type: 'video',
      fileId: msg.video.file_id,
      fileName: msg.video.file_name || 'Video.mp4',
      mimeType: 'video/mp4',
      fileSize: msg.video.file_size || 0
    };
  }
  if (msg.audio) {
    return {
      type: 'audio',
      fileId: msg.audio.file_id,
      fileName: msg.audio.file_name || 'Audio.mp3',
      mimeType: 'audio/mpeg',
      fileSize: msg.audio.file_size || 0
    };
  }
  if (msg.voice) {
    return {
      type: 'voice',
      fileId: msg.voice.file_id,
      fileName: 'Voice.ogg',
      mimeType: 'audio/ogg',
      fileSize: msg.voice.file_size || 0
    };
  }
  if (msg.animation) {
    return {
      type: 'animation',
      fileId: msg.animation.file_id,
      fileName: 'Animation.gif',
      mimeType: 'image/gif',
      fileSize: msg.animation.file_size || 0
    };
  }
  if (msg.sticker) {
    return {
      type: 'sticker',
      fileId: msg.sticker.file_id,
      fileName: 'Sticker.webp',
      mimeType: 'image/webp',
      fileSize: msg.sticker.file_size || 0
    };
  }
  return null;
}

// Main file handler - handles ALL cases
bot.on(['document', 'photo', 'video', 'audio', 'voice', 'animation', 'sticker'], async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message;
  
  console.log(`📁 File received from user ${userId}`);

  // ==========================================
  // 🔑 ADMIN: Get File ID - Handles ALL cases!
  // ==========================================
  if (userId === ADMIN_ID) {
    
    // CASE 1: Check if it's a forwarded message
    const isForwarded = message.forward_from_chat || message.forward_from;
    
    // Try to get file info directly
    let fileInfo = extractFileInfo(message);
    
    // If we have file info, show it!
    if (fileInfo) {
      let forwardedNote = isForwarded ? '\n📤 **Forwarded File** - ID extracted successfully!' : '';
      
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
        `3️⃣ የ 'file_id' እሴትን በተቀዳው ID ይቀይሩ`,
        { parse_mode: 'Markdown' }
      );
    }
    
    // CASE 2: If it's forwarded but we couldn't get file info directly
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
      ADMIN_ID,
      ctx.chat.id,
      message.message_id
    );

    db.pendingReceipts[forwardedMsg.message_id] = {
      userId: userId,
      orderNumber: orderNumber,
      confidence: validation.confidence
    };

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `📥 **አዲስ ሪሲት**\n\n` +
      `🧾 Order: #${orderNumber}\n` +
      `👤 User: ${userId}\n` +
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

    ctx.reply(
      `✅ ሪሲትዎ ተረጋግጧል!\n\n` +
      `🧾 Order: #${orderNumber}\n` +
      `📊 Confidence: ${validation.confidence}%\n\n` +
      `አድሚኑ በጥቂት ደቂቃዎች ውስጥ ያጸድቀዋል!`
    );
  } catch (error) {
    console.error('Error:', error);
    ctx.reply("⚠️ ሪሲትዎን ማስኬድ አልቻልኩም።");
  }
});

// ==========================================
// 10. GET FILE ID COMMAND - For forwarded files!
// ==========================================
bot.command('getfileid', async (ctx) => {
  // Only admin can use this
  if (ctx.from.id !== ADMIN_ID) {
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
  
  // Check all possible file types in the replied message
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
    // Check if the file was forwarded
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
// 11. HELP COMMAND
// ==========================================
bot.command('help', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  
  ctx.reply(
    `📚 **Bot Commands & Help**\n\n` +
    `**📁 Getting File ID:**\n` +
    `1️⃣ Send file directly → Auto shows ID\n` +
    `2️⃣ Forward file → Reply with /getfileid\n` +
    `3️⃣ Use @get_id_bot for any file\n\n` +
    `**🔧 Admin Commands:**\n` +
    `• /stats - View bot statistics\n` +
    `• /getfileid - Get ID from replied file\n` +
    `• /backup - Download database backup\n` +
    `• /help - Show this help\n\n` +
    `**📚 Book Categories:**\n` +
    `• Ge'ez: Law, History, Bible\n` +
    `• Ge'ez-Amharic: All categories\n` +
    `• Amharic: All categories\n` +
    `• English: All categories`,
    { parse_mode: 'Markdown' }
  );
});

// ==========================================
// 12. ADMIN ACTIONS
// ==========================================
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
    `✅ ክፍያ #${orderNumber} ተቀባይነት አግኝቷል! ሁሉንም መጽሐፍት ማውረድ ይችላሉ።`
  );

  ctx.editMessageText(`✅ ክፍያ #${orderNumber} ጸድቋል`);
});

bot.action(/^reject_(\d+)_(.+)$/, (ctx) => {
  const targetUserId = parseInt(ctx.match[1]);
  const orderNumber = ctx.match[2];

  ctx.telegram.sendMessage(
    targetUserId,
    `❌ ክፍያ #${orderNumber} ውድቅ ተደርጓል። እባክዎን ትክክለኛ ሪሲት ይላኩ።`
  );

  ctx.editMessageText(`❌ ክፍያ #${orderNumber} ውድቅ ተደርጓል`);
});

// ==========================================
// 13. SEARCH
// ==========================================
bot.hears('🔍 መጽሐፍ ፈልግ', (ctx) => {
  ctx.reply("እባክዎን የመጽሐፍ ስም ያስገቡ፦");
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
    return ctx.reply("ምንም መጽሐፍ አልተገኘም።");
  }

  const buttons = matches.map((book, index) => [
    Markup.button.callback(`${index + 1}. ${book.title}`, `gb_${book.catKey}_${book.id}`)
  ]);

  ctx.reply(`🔍 ውጤቶች (${matches.length})፦`, Markup.inlineKeyboard(buttons));
});

// ==========================================
// 14. ADMIN COMMANDS
// ==========================================
bot.command('stats', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const totalUsers = Object.keys(db.users).length;
  const paidUsers = Object.values(db.users).filter(u => u.is_paid).length;

  ctx.reply(`📊 ስታቲስቲክስ\n\n• ጠቅላላ: ${totalUsers}\n• ክፍያ የፈጸሙ: ${paidUsers}\n• ነፃ: ${totalUsers - paidUsers}`);
});

bot.command('backup', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const backupData = JSON.stringify(db, null, 2);
  ctx.replyWithDocument({
    source: Buffer.from(backupData, 'utf-8'),
    filename: `backup_${Date.now()}.json`
  });
});

// ==========================================
// 15. LAUNCH
// ==========================================
bot.catch((err, ctx) => {
  console.error(`Error:`, err);
});

bot.launch({
  dropPendingUpdates: true
}).then(() => {
  console.log("✅ Bot is running...");
  console.log("📚 Orthodox Spiritual Books Bot is ready!");
  console.log("👑 Admin ID:", ADMIN_ID);
}).catch((err) => {
  console.error("❌ Failed to launch:", err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));