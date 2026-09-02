const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const ADMIN_ID = Number(process.env.ADMIN_ID) || 7480368503;
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
  "geez_law": [
    { id: "1", file_id: "DUMMY_GEEZ_LAW_01", title: "ርትዐ ነገሥት (ግዕዝ)" },
    { id: "2", file_id: "DUMMY_GEEZ_LAW_02", title: "ፍትሐ ነገሥት (ግዕዝ)" }
  ],
  "geez_ot": [
    { id: "1", file_id: "BQACAgQAAxkBAAMYapd7UbkpzfZTIng9daYvw8A1q-4AAn0JAAIWA9hQw4UxsdCUEow9BA", title: "፭ቱ መጽሐፍተ ኦሪት ብራና ትርጓሜ " }
  ]
};

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
function isPaidUser(userId) {
  if (Number(userId) === Number(ADMIN_ID)) return true;
  return db.users[userId] && db.users[userId].is_paid === true;
}

function registerUser(from) {
  if (!db.users[from.id]) {
    db.users[from.id] = {
      username: from.username ? `@${from.username}` : "No Username",
      is_paid: false,
      registration_date: new Date().toISOString()
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
// 6. ROUTING & HANDLERS
// ==========================================
bot.action("lang_geez", (ctx) => {
  ctx.editMessageText(
    "በግዕዝ ቋንቋ የትኛውን የመጽሐፍ ምድብ ማንበብ ይፈልጋሉ?",
    Markup.inlineKeyboard([
      [Markup.button.callback("ሕግና ሥርዓት", "cat_geez_law")],
      [Markup.button.callback("የመጽሐፍ ቅዱስ ክፍል", "sub_geez_bible")],
      [Markup.button.callback("⬅️ ተመለስ", "back_to_lang")]
    ])
  );
});

bot.action("back_to_lang", (ctx) => {
  ctx.editMessageText(
    "እባኮን በምን ቋንቋ መጽሐፍ ማንበብ ይፈልጋሉ?",
    Markup.inlineKeyboard([
      [Markup.button.callback("በግዕዝ", "lang_geez"), Markup.button.callback("በግዕዝ አማርኛ", "lang_ga")],
      [Markup.button.callback("የግዕዝ ቋንቋ መማሪያ", "cat_geez_edu")],
      [Markup.button.callback("በአማርኛ", "lang_amh"), Markup.button.callback("In English", "lang_eng")]
    ])
  );
});

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
// 7. BOOK DELIVERY LOGIC
// ==========================================
bot.action(/^gb_(.+)_(.+)$/, async (ctx) => {
  const catKey = ctx.match[1];
  const bookId = ctx.match[2];
  const userId = ctx.from.id;
  const book = findBook(catKey, bookId);

  if (!book) {
    return ctx.answerCbQuery("መጽሐፉ አልተገኘም።", { show_alert: true });
  }

  if (!isPaidUser(userId)) {
    return ctx.reply(
      `የኦርቶዶክስ መንፈሳዊ መጽሐፍት\n\nሁሉንም የመጽሐፍ ዓይነቶች ሙሉ በሙሉ ለመጠቀም 200 ብር ይክፈሉ።\n\n💳 Telebirr: 0943910036\nCBE: 1000661046841\n\nክፍያ እንደፈጸሙ የባንክ ሪሲት ወደዚህ ቦት ይላኩ።`,
      Markup.inlineKeyboard([
        [Markup.button.callback("👁 ቅምሻ / Preview", `prev_${catKey}_${bookId}`)]
      ])
    );
  }

  try {
    await ctx.replyWithDocument(book.file_id, {
      caption: `📖 ${book.title}\n\nመልካም ንባብ!`,
      protect_content: true
    });
  } catch (err) {
    console.error("File send error:", err);
    ctx.reply(`⚠️ የመጽሐፉ ስም፦ ${book.title}\n\nፋይሉን መላክ አልተቻለም። File ID ስህተት ነው ወይም ፋይሉ ተሰርዟል።`);
  }
});

// ==========================================
// 8. ADMIN FILE ID GENERATOR (DIRECT & FORWARD)
// ==========================================
bot.on(['document', 'photo', 'audio', 'video'], async (ctx, next) => {
  const userId = ctx.from ? ctx.from.id : null;

  // አድሚን መሆንህን ማረጋገጥ
  if (userId && Number(userId) === Number(ADMIN_ID)) {
    let fileId = "";
    let fileName = "ፋይል";
    const msg = ctx.message;

    if (msg.document) {
      fileId = msg.document.file_id;
      fileName = msg.document.file_name || "Document";
    } else if (msg.photo) {
      fileId = msg.photo[msg.photo.length - 1].file_id;
      fileName = "Photo";
    } else if (msg.audio) {
      fileId = msg.audio.file_id;
      fileName = msg.audio.file_name || "Audio";
    } else if (msg.video) {
      fileId = msg.video.file_id;
      fileName = "Video";
    }

    if (fileId) {
      try {
        await ctx.reply(
          `🔑 **የፋይሉ ID ተዘጋጅቷል (Admin Only)**\n\n` +
          `📄 **File Name:** \`${fileName}\`\n` +
          `🆔 **File ID:** \`${fileId}\`\n\n` +
          `ይህንን File ID ኮፒ በማድረግ በ 'booksDatabase' ውስጥ በ 'file_id' ቦታ ማስገባት ይችላሉ።`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error("Error sending File ID:", err);
      }
      return; // ለአድሚን ስለተላከ ወደ ሪሲት ማጣሪያ እንዳያልፍ እዚሁ ያቆማል!
    }
  }

  // ተራ ተጠቃሚ ከሆነ ወደ ሪሲት ማጣሪያ ያሳልፈዋል
  return next();
});

// ==========================================
// 9. RECEIPT & APPROVAL LOGIC (USERS ONLY)
// ==========================================
bot.on(['photo', 'document'], async (ctx) => {
  const userId = ctx.from.id;
  
  if (isPaidUser(userId)) {
    return ctx.reply("እርስዎ ቀደም ሲል ክፍያ ፈጽመዋል። ተጨማሪ ሪሲት መላክ አያስፈልግዎትም።");
  }

  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    await ctx.telegram.forwardMessage(ADMIN_ID, ctx.chat.id, ctx.message.message_id);
    
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `📥 **አዲስ የክፍያ ሪሲት ደርሷል!**\n\n` +
      `🧾 **Order No:** \`#${orderNumber}\`\n` +
      `👤 **ተጠቃሚ ID:** \`${userId}\`\n` +
      `👤 **Username:** @${ctx.from.username || 'የለውም'}`,
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

    ctx.reply(`✅ የላኩት ሪሲት ደርሶናል! የትዕዛዝ ቁጥርዎ፦ #${orderNumber}`);
  } catch (err) {
    console.error("Forwarding error:", err);
    ctx.reply("⚠️ ሪሲቱን ለአድሚን መላክ አልተቻለም። እባክዎን በኋላ ድጋሚ ይሞክሩ።");
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

  ctx.telegram.sendMessage(targetUserId, `✅ የትዕዛዝ ቁጥር #${orderNumber} ክፍያዎ ጸድቋል! አሁን መጽሐፍ ማውረድ ይችላሉ።`);
  ctx.editMessageText(`✅ የ ተጠቃሚ ${targetUserId} ክፍያ ጸድቋል።`);
});

// ==========================================
// 10. BOT LAUNCH
// ==========================================
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
});

bot.launch({ dropPendingUpdates: true })
  .then(() => console.log("Bot started successfully..."))
  .catch(err => console.error("Launch error:", err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));