/**
 * Lớp lỗi chuẩn hóa dùng chung toàn hệ thống XD-Short Studio.
 * Phân định rõ giữa lỗi vận hành (Operational Error) và lỗi lập trình/hệ thống.
 */
export class AppError extends Error {
  /**
   * @param {Object} options
   * @param {string} options.code Mã định danh lỗi (e.g. 'AI_QUOTA_EXCEEDED', 'RENDER_OOM')
   * @param {number} [options.statusCode=500] Mã HTTP status code
   * @param {'ai'|'tts'|'render'|'asset'|'auth'|'storage'|'validation'} [options.domain='ai'] Phân vùng lỗi
   * @param {string} options.technicalMessage Chi tiết lỗi kỹ thuật tiếng Anh để logging/debug
   * @param {string} options.userMessage Thông điệp tiếng Việt rõ ràng, thân thiện cho người dùng
   * @param {string} [options.actionHint=''] Hướng dẫn hành động cụ thể để người dùng tự khắc phục
   * @param {boolean} [options.isOperational=true] true nếu là lỗi môi trường/hạn ngạch, false nếu là unhandled exception
   * @param {any} [options.originalError=null] Lỗi gốc đi kèm (nếu có)
   */
  constructor({
    code,
    statusCode = 500,
    domain = 'ai',
    technicalMessage,
    userMessage,
    actionHint = '',
    isOperational = true,
    originalError = null
  }) {
    super(technicalMessage || userMessage);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.domain = domain;
    this.technicalMessage = technicalMessage || this.message;
    this.userMessage = userMessage;
    this.actionHint = actionHint;
    this.isOperational = isOperational;
    this.originalError = originalError;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      code: this.code,
      domain: this.domain,
      error: this.userMessage,
      actionHint: this.actionHint,
      technicalMessage: process.env.NODE_ENV === 'development' ? this.technicalMessage : undefined
    };
  }
}
