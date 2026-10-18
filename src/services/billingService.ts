import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface TransactionReceipt {
  transactionId: string;
  amount: number;
  description?: string;
  targetUid: string;
  targetEmail?: string;
  targetTier: string;
  licenseKey?: string;
  processedAt: string;
  status: 'success' | 'completed' | 'pending' | 'failed' | string;
  gateway?: string;
  note?: string;
  cycle?: 'month' | 'year';
  bonusVideos?: number;
  expectedAmount?: number;
}

// In-memory session cache to avoid repeated Firestore reads
const sessionReceiptsCache = new Map<string, { data: TransactionReceipt[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const billingService = {
  /**
   * Fetch transaction receipts for the authenticated user.
   * Matches firestore.rules (resource.data.targetUid == request.auth.uid).
   * Sorts descending in client-side RAM to avoid requiring composite indexes.
   */
  async getUserTransactions(uid: string, forceRefresh = false): Promise<TransactionReceipt[]> {
    if (!uid || uid === 'usr_creator_guest' || uid === 'GUEST') {
      return [];
    }

    // 1. Check in-memory cache
    if (!forceRefresh) {
      const cached = sessionReceiptsCache.get(uid);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    try {
      // 2. Query Firestore transactions with targetUid filter
      const txRef = collection(db, 'transactions');
      const q = query(txRef, where('targetUid', '==', uid));
      const snapshot = await getDocs(q);

      const receipts: TransactionReceipt[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let processedAt = new Date().toISOString();
        const rawTime = data.processedAt || data.createdAt;
        if (rawTime) {
          if (typeof rawTime.toDate === 'function') {
            processedAt = rawTime.toDate().toISOString();
          } else if (typeof rawTime === 'string') {
            processedAt = rawTime;
          } else if (rawTime.seconds) {
            processedAt = new Date(rawTime.seconds * 1000).toISOString();
          }
        }

        receipts.push({
          transactionId: data.transactionId || doc.id,
          amount: Number(data.amount || 0),
          description: data.description || '',
          targetUid: data.targetUid || uid,
          targetEmail: data.targetEmail || '',
          targetTier: data.targetTier || 'creator',
          licenseKey: data.licenseKey || '',
          processedAt,
          status: data.status || 'success',
          gateway: data.gateway || 'VietQR',
          note: data.note || '',
          cycle: data.cycle,
          bonusVideos: data.bonusVideos,
          expectedAmount: data.expectedAmount,
        });
      });

      // 3. Client-side sort by processedAt descending (Zero Index Error guarantee)
      receipts.sort((a, b) => {
        const timeA = new Date(a.processedAt).getTime() || 0;
        const timeB = new Date(b.processedAt).getTime() || 0;
        return timeB - timeA;
      });

      // 4. Save to session cache
      sessionReceiptsCache.set(uid, {
        data: receipts,
        fetchedAt: Date.now(),
      });

      return receipts;
    } catch (err) {
      console.warn('[BillingService] Failed to load transactions:', err);
      return [];
    }
  },

  /**
   * Clears session cache (e.g. after a new purchase or key redemption)
   */
  clearCache(uid?: string) {
    if (uid) {
      sessionReceiptsCache.delete(uid);
    } else {
      sessionReceiptsCache.clear();
    }
  },

  /**
   * Currency formatter for Vietnamese Dong
   */
  formatVnd(amount: number): string {
    if (!amount || amount <= 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount)
      .replace('₫', 'đ');
  },

  /**
   * Format ISO date string to Vietnamese date time
   */
  formatDateTime(isoString?: string | null): string {
    if (!isoString) return '--/--/----';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/----';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  },

  /**
   * Calculate subscription remaining days and formatted label
   */
  getSubscriptionCountdown(expiresAtIso?: string | null, planTier: string = 'free'): {
    isExpired: boolean;
    isInfinite: boolean;
    daysLeft: number;
    label: string;
  } {
    if (planTier === 'admin') {
      return { isExpired: false, isInfinite: true, daysLeft: 9999, label: 'Vô hạn (Super Admin)' };
    }

    if (planTier === 'free') {
      return { isExpired: false, isInfinite: true, daysLeft: 0, label: 'Gói Miễn Phí (Vĩnh viễn)' };
    }

    if (!expiresAtIso) {
      return { isExpired: false, isInfinite: true, daysLeft: 0, label: 'Đang hoạt động (Trọn đời)' };
    }

    const expiryTime = new Date(expiresAtIso).getTime();
    if (isNaN(expiryTime)) {
      return { isExpired: false, isInfinite: true, daysLeft: 0, label: 'Đang hoạt động' };
    }

    const now = Date.now();
    const diffMs = expiryTime - now;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return { isExpired: true, isInfinite: false, daysLeft: 0, label: 'Đã hết hạn' };
    }

    const d = new Date(expiryTime);
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    return {
      isExpired: false,
      isInfinite: false,
      daysLeft,
      label: `Hết hạn ${dateFormatted} (Còn ${daysLeft} ngày)`,
    };
  },
};
