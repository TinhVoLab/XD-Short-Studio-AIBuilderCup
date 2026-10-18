import { adminDb } from '../middlewares/auth.js';

/**
 * Telegram Notification Service for XD-Short Studio
 * Allows real-time transaction notifications directly to the Super Admin's phone.
 */
class TelegramService {
  /**
   * Retrieves active Telegram bot configuration from Firestore or env
   */
  async getConfig() {
    let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    let chatId = process.env.TELEGRAM_CHAT_ID || '';

    try {
      if (adminDb) {
        const configDoc = await adminDb.collection('system_settings').doc('app_config').get();
        if (configDoc.exists) {
          const data = configDoc.data();
          if (data?.telegramBotToken) botToken = data.telegramBotToken;
          if (data?.telegramChatId) chatId = data.telegramChatId;
        }
      }
    } catch (err) {
      console.warn('⚠️ [TelegramService]: Failed to fetch config from Firestore:', err.message);
    }

    return { botToken: botToken.trim(), chatId: chatId.trim() };
  }

  /**
   * Sends a generic formatted HTML message to Telegram
   */
  async sendMessage(text, customToken, customChatId) {
    const config = await this.getConfig();
    const botToken = customToken || config.botToken;
    const chatId = customChatId || config.chatId;

    if (!botToken || !chatId) {
      console.log('ℹ️ [TelegramService]: Bot Token or Chat ID not configured, skipping alert.');
      return { success: false, reason: 'unconfigured' };
    }

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description || 'Telegram API returned error');
      }

      console.log('✅ [TelegramService]: Alert successfully delivered to Telegram.');
      return { success: true, data };
    } catch (err) {
      console.error('❌ [TelegramService Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sends a beautiful payment success card to Super Admin
   */
  async sendPaymentAlert({
    email,
    uid,
    amount,
    planTier,
    transactionId,
    description,
    bankName,
    accountNumber,
  }) {
    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const formattedAmount = Number(amount || 0).toLocaleString('vi-VN');
    const tierLabel = planTier?.toUpperCase() === 'BUSINESS' ? 'BUSINESS PRO (VIP)' : 'CREATOR PRO';

    const message = [
      `💰 <b>[XD-SHORT] ĐƠN HÀNG MỚI ĐÃ THANH TOÁN!</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Khách hàng:</b> <code>${email || 'Ẩn danh'}</code>`,
      `🆔 <b>UID:</b> <code>${uid || 'N/A'}</code>`,
      `📦 <b>Gói kích hoạt:</b> <b>${tierLabel}</b>`,
      `💵 <b>Số tiền nạp:</b> <b>+${formattedAmount} đ</b>`,
      `🏦 <b>Ngân hàng:</b> ${bankName || 'ACB'} (${accountNumber || '271090168'})`,
      `📝 <b>Cú pháp GD:</b> <code>${description || 'N/A'}</code>`,
      `🔖 <b>Mã giao dịch:</b> <code>${transactionId || 'N/A'}</code>`,
      `⚡ <b>Trạng thái:</b> <i>Đã tự động nâng cấp thành công (3s)</i>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⏰ <i>${timeStr}</i>`,
    ].join('\n');

    return this.sendMessage(message);
  }

  /**
   * Sends a test ping to verify Telegram credentials
   */
  async sendTestPing(botToken, chatId) {
    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const message = [
      `🚀 <b>[XD-SHORT STUDIO] KẾT NỐI TELEGRAM THÀNH CÔNG!</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `Xin chào Super Admin, bot thông báo doanh thu tự động của bạn đã sẵn sàng hoạt động.`,
      ``,
      `🔔 Từ bây giờ, mỗi khi có khách hàng quét mã VietQR và tiền vào tài khoản ngân hàng, bạn sẽ nhận được thông báo tức thì ngay tại đây.`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⏰ <i>Thời gian kiểm tra: ${timeStr}</i>`,
    ].join('\n');

    return this.sendMessage(message, botToken, chatId);
  }
}

export const telegramService = new TelegramService();
