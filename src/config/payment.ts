import { UserPlanTier } from '@/types/auth';

/**
 * Official Corporate Payment Configuration for XD-Short Studio
 * Owned by: CÔNG TY TNHH THẾ GIỚI SỐ X-DMAIC
 */
export const COMPANY_PAYMENT_INFO = {
  companyName: 'CÔNG TY TNHH THẾ GIỚI SỐ X-DMAIC',
  accountName: 'CONG TY TNHH THE GIOI SO X-DMAIC',
  bankName: 'ACB (Ngân hàng TMCP Á Châu)',
  bankCode: 'acb',
  accountNumber: '271090168',
  supportHotline: '0967896567',
  supportZalo: 'https://zalo.me/0967896567',
  vatInvoiceNote: 'Doanh nghiệp hoặc Agency cần xuất hóa đơn GTGT điện tử (VAT) xin vui lòng liên hệ Zalo/Hotline kèm mã số thuế sau khi chuyển khoản.',
} as const;

/**
 * Generate VietQR QuickPay URL
 */
export function generateVietQrUrl(params: {
  amount: number;
  transferContent: string;
}): string {
  const { amount, transferContent } = params;
  const encodedContent = encodeURIComponent(transferContent);
  const encodedName = encodeURIComponent(COMPANY_PAYMENT_INFO.accountName);
  return `https://img.vietqr.io/image/${COMPANY_PAYMENT_INFO.bankCode}-${COMPANY_PAYMENT_INFO.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedName}`;
}

import { API_BASE, apiFetch } from './api';

/**
 * Redeem and activate plan tier from a given License Key via secure backend API
 */
export async function redeemLicenseKey(rawKey: string): Promise<{
  success: boolean;
  tier?: UserPlanTier;
  message?: string;
  error?: string;
  subscriptionExpiresAt?: string;
}> {
  const cleanKey = rawKey.trim().toUpperCase();
  if (!cleanKey) {
    return { success: false, error: 'Vui lòng nhập mã kích hoạt.' };
  }

  try {
    const res = await apiFetch(`${API_BASE}/api/payment/redeem-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: cleanKey }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Mã kích hoạt không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.',
      };
    }

    return {
      success: true,
      tier: data.tier,
      message: data.message,
      subscriptionExpiresAt: data.subscriptionExpiresAt,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Không thể kết nối máy chủ để kích hoạt mã.',
    };
  }
}
