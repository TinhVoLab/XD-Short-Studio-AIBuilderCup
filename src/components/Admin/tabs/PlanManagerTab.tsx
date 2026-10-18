import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button, FormGroup, SectionHeader } from '@/components/ui';
import { DEFAULT_PLANS, DynamicPlanConfig, MarketingBulletItem, PLAN_FEATURES, RETENTION_BUCKETS_DAYS, mergePlansWithDefaults } from '@/config/planCatalog';
import { useEditorStore } from '@/store/useEditorStore';

interface PlanManagerTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const PlanManagerTab: React.FC<PlanManagerTabProps> = ({ adminFetch, showToast }) => {
  const fetchGlobalPlans = useEditorStore((s) => s.fetchPlans);
  const [plans, setPlans] = useState<DynamicPlanConfig[]>(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('creator');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load plans from server on mount
  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/plans');
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlans(mergePlansWithDefaults(data));
          if (!data.some((p) => p.id === selectedPlanId)) {
            setSelectedPlanId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch admin plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || DEFAULT_PLANS[0];

  // Helper to update field in activePlan
  const updateActivePlan = (patch: Partial<DynamicPlanConfig>) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, ...patch } : p))
    );
  };

  // Helper to update pricing
  const updatePricing = (patch: Partial<DynamicPlanConfig['pricing']>) => {
    const updatedPricing = { ...activePlan.pricing, ...patch };
    // Auto-calculate annual total & discount percent
    if (patch.annualUnitPrice !== undefined || patch.monthlyPrice !== undefined) {
      const monthly = patch.monthlyPrice !== undefined ? patch.monthlyPrice : activePlan.pricing.monthlyPrice;
      const annualUnit = patch.annualUnitPrice !== undefined ? patch.annualUnitPrice : activePlan.pricing.annualUnitPrice;
      updatedPricing.annualTotalPayable = annualUnit * 12;
      if (monthly > 0) {
        updatedPricing.discountPercent = Math.max(0, Math.round((1 - annualUnit / monthly) * 100));
      }
    }
    updateActivePlan({ pricing: updatedPricing });
  };

  // Helper to update quotas
  const updateQuotas = (patch: Partial<DynamicPlanConfig['quotas']>) => {
    updateActivePlan({ quotas: { ...activePlan.quotas, ...patch } });
  };

  // Helper to update a feature flag
  const toggleFeatureFlag = (key: string) => {
    const current = Boolean(activePlan.features?.[key]);
    updateActivePlan({
      features: {
        ...activePlan.features,
        [key]: !current,
      },
    });
  };

  // Bullet Features Management (Marketing items)
  const addBulletItem = () => {
    const newItem: MarketingBulletItem = {
      id: `bf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: 'Tính năng quyền lợi mới...',
      isEnabled: true,
    };
    updateActivePlan({
      bulletFeatures: [...(activePlan.bulletFeatures || []), newItem],
    });
  };

  const updateBulletItem = (id: string, patch: Partial<MarketingBulletItem>) => {
    const updated = (activePlan.bulletFeatures || []).map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    updateActivePlan({ bulletFeatures: updated });
  };

  const deleteBulletItem = (id: string) => {
    const updated = (activePlan.bulletFeatures || []).filter((item) => item.id !== id);
    updateActivePlan({ bulletFeatures: updated });
  };

  // Save changes to backend
  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/plans/${activePlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(activePlan),
      });
      if (res && res.ok) {
        showToast(`Đã lưu cấu hình gói "${activePlan.name}" thành công!`);
        // Refresh global client store so studio & landing page update instantly
        await fetchGlobalPlans().catch(() => {});
      } else {
        showToast('Lỗi khi lưu cấu hình gói cước');
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message || 'Không thể lưu'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all to defaults
  const handleResetDefaults = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục toàn bộ các gói về cấu hình gốc mặc định?')) return;
    setIsSaving(true);
    try {
      const res = await adminFetch('/plans/reset', { method: 'POST' });
      if (res && res.ok) {
        const data = await res.json();
        setPlans(mergePlansWithDefaults(data.plans));
        showToast('Đã khôi phục toàn bộ gói cước về mặc định!');
        await fetchGlobalPlans().catch(() => {});
      }
    } catch (err: any) {
      showToast(`Lỗi khôi phục: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.settingsFormWrap}>
      {/* ── Plan Selector Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginRight: 4 }}>
            CHỌN GÓI CẦN CẤU HÌNH:
          </span>
          {plans.map((p) => {
            const isSelected = p.id === activePlan.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlanId(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(190, 255, 1, 0.12)' : 'var(--surface-2)',
                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                  fontSize: 12.5,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{p.name}</span>
                <span style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: p.isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: p.isActive ? '#38bdf8' : '#ef4444',
                }}>
                  {p.isActive ? 'ĐANG MỞ' : 'ẨN'}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="secondary"
          size="xs"
          onClick={loadPlans}
          disabled={isLoading}
          leftIcon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          }
        >
          {isLoading ? 'Đang tải...' : 'Làm Mới'}
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── PANEL 1: THƯƠNG MẠI & GIÁ BÁN ── */}
        <div className={styles.panel}>
          <SectionHeader
            title={`1. Cấu Hình Giá Bán & Khuyến Mãi — ${activePlan.name}`}
            subtitle="Thiết lập tên gọi, định giá chu kỳ tháng/năm, và trạng thái hiển thị mở bán"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className={styles.settingsFormRow}>
              <FormGroup label="Tên Gói Cước (Hiển thị)">
                <input
                  type="text"
                  className={styles.formInput}
                  value={activePlan.name}
                  onChange={(e) => updateActivePlan({ name: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Badge Nổi Bật (VD: Phổ Biến Nhất, Sale -40%)">
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Để trống nếu không dùng"
                  value={activePlan.badgeText || ''}
                  onChange={(e) => updateActivePlan({ badgeText: e.target.value })}
                />
              </FormGroup>
            </div>

            <FormGroup label="Mô Tả Ngắn Đối Tượng Khách Hàng">
              <input
                type="text"
                className={styles.formInput}
                value={activePlan.description || ''}
                onChange={(e) => updateActivePlan({ description: e.target.value })}
              />
            </FormGroup>

            <div className={styles.settingsFormRow}>
              <FormGroup
                label="Giá Thanh Toán Theo Tháng (VNĐ / Tháng)"
                description="Khách thanh toán từng tháng một lần qua VietQR"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  step="1000"
                  value={activePlan.pricing?.monthlyPrice || 0}
                  onChange={(e) => updatePricing({ monthlyPrice: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup
                label="Giá Tháng Khi Mua Cả Năm (VNĐ / Tháng)"
                description="Tự động nhân 12 để tính tổng tiền thanh toán gói năm"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  step="1000"
                  value={activePlan.pricing?.annualUnitPrice || 0}
                  onChange={(e) => updatePricing({ annualUnitPrice: Number(e.target.value) })}
                />
              </FormGroup>
            </div>

            {/* Quick Price Calculation Summary */}
            <div style={{
              display: 'flex',
              gap: 16,
              padding: '10px 14px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--text-sub)',
            }}>
              <div>
                Tổng thu 1 năm: <strong style={{ color: 'var(--accent)' }}>
                  {(activePlan.pricing?.annualTotalPayable || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                Tiết kiệm: <strong style={{ color: '#38bdf8' }}>
                  {activePlan.pricing?.discountPercent || 0}%
                </strong>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(activePlan.isActive)}
                    onChange={(e) => updateActivePlan({ isActive: e.target.checked })}
                    style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                  />
                  <span>Mở bán gói này trên Landing Page &amp; Modal Nâng Cấp</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── PANEL 2: HẠN NGẠCH KỸ THUẬT (QUOTAS) ── */}
        <div className={styles.panel}>
          <SectionHeader
            title={`2. Hạn mức — ${activePlan.name}`}
            subtitle="Server áp các giá trị này khi xuất video và gọi AI"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className={styles.settingsFormRow}>
              <FormGroup label="Video mỗi tháng" tooltip="Số lượt xuất video mỗi tháng; video dài tính nhiều lượt">
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  value={activePlan.quotas?.monthlyVideoLimit ?? 0}
                  onChange={(e) => updateQuotas({ monthlyVideoLimit: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup label="Lượt AI mỗi ngày" tooltip="Số lần dùng AI dựng video mỗi ngày (giờ Việt Nam)">
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  value={activePlan.quotas?.dailyAiLimit ?? 0}
                  onChange={(e) => updateQuotas({ dailyAiLimit: Number(e.target.value) })}
                />
              </FormGroup>
            </div>

            <div className={styles.settingsFormRow}>
              <FormGroup label="Độ dài 1 lượt (giây)" tooltip="Video dài tới mức này tính 1 lượt">
                <input
                  type="number"
                  className={styles.formInput}
                  min="1"
                  value={activePlan.quotas?.maxVideoSec ?? 30}
                  onChange={(e) => updateQuotas({ maxVideoSec: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup label="Độ dài tối đa (giây)" tooltip="Video dài hơn mức 1 lượt nhưng không quá mức này tính số lượt bên cạnh. Đặt bằng độ dài 1 lượt để tắt">
                <input
                  type="number"
                  className={styles.formInput}
                  min="1"
                  value={activePlan.quotas?.longVideoMaxSec ?? activePlan.quotas?.maxVideoSec ?? 30}
                  onChange={(e) => updateQuotas({ longVideoMaxSec: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup label="Lượt cho video dài" tooltip="Số lượt trừ cho video dài hơn mức 1 lượt">
                <input
                  type="number"
                  className={styles.formInput}
                  min="1"
                  value={activePlan.quotas?.longVideoCredits ?? 2}
                  onChange={(e) => updateQuotas({ longVideoCredits: Number(e.target.value) })}
                />
              </FormGroup>
            </div>

            <div className={styles.settingsFormRow}>
              <FormGroup label="Độ phân giải tối đa" tooltip="Server kẹp độ phân giải xuất theo giá trị này">
                <select
                  className={styles.formInput}
                  value={activePlan.quotas?.maxResolution || '720p'}
                  onChange={(e) => updateQuotas({ maxResolution: e.target.value as DynamicPlanConfig['quotas']['maxResolution'] })}
                >
                  <option value="720p">720p (720 × 1280)</option>
                  <option value="1080p">1080p (1080 × 1920)</option>
                </select>
              </FormGroup>

              <FormGroup label="Lưu video (ngày)" tooltip="Video xuất xong được giữ để tải lại trong số ngày này, sau đó bucket tự xoá">
                <select
                  className={styles.formInput}
                  value={activePlan.quotas?.storageRetentionDays ?? 1}
                  onChange={(e) => updateQuotas({ storageRetentionDays: Number(e.target.value) })}
                >
                  {RETENTION_BUCKETS_DAYS.map((d) => (
                    <option key={d} value={d}>{d} ngày</option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup label="Video xuất cùng lúc" tooltip="Số video một tài khoản được xuất song song">
                <input
                  type="number"
                  className={styles.formInput}
                  min="1"
                  value={activePlan.quotas?.concurrentRenders ?? 1}
                  onChange={(e) => updateQuotas({ concurrentRenders: Number(e.target.value) })}
                />
              </FormGroup>
            </div>
          </div>
        </div>

        {/* ── PANEL 3: TẦNG 1 - MA TRẬN PHÂN QUYỀN KỸ THUẬT ── */}
        <div className={styles.panel}>
          <SectionHeader
            title={`3. Ma Trận Phân Quyền Kỹ Thuật (Feature Flags) — ${activePlan.name}`}
            subtitle="Bật/Tắt (ON/OFF) trực tiếp các quyền hạn phần mềm của gói này. Thay đổi áp dụng tức thì mà không cần code"
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
            marginTop: 14,
          }}>
            {PLAN_FEATURES.map((feat) => {
              const isEnabled = Boolean(activePlan.features?.[feat.key]);
              return (
                <div
                  key={feat.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    background: isEnabled ? 'rgba(190, 255, 1, 0.04)' : 'var(--surface-2)',
                    border: isEnabled ? '1px solid rgba(190, 255, 1, 0.25)' : '1px solid var(--border)',
                    borderRadius: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: isEnabled ? 'var(--accent)' : 'var(--text-muted)',
                      }} />
                      <strong style={{ fontSize: 13, color: isEnabled ? 'var(--text)' : 'var(--text-sub)' }}>
                        {feat.name}
                      </strong>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: 'var(--text-sub)', lineHeight: 1.4 }}>
                      {feat.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFeatureFlag(String(feat.key))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: isEnabled ? 'var(--accent)' : 'var(--surface-3)',
                      color: isEnabled ? '#000' : 'var(--text-sub)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PANEL 4: TẦNG 2 - TRÌNH QUẢN LÝ DÒNG CHỮ TIẾP THỊ ── */}
        <div className={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <SectionHeader
              title={`4. Dòng Quyền Lợi Hiển Thị Trên Bảng Giá (Marketing Features) — ${activePlan.name}`}
              subtitle="Các dòng chữ tick xanh xuất hiện trên Landing Page và Modal Bảng Giá. Tự do Thêm / Sửa / Xóa hoặc Bật / Tắt"
            />
            <Button
              variant="secondary"
              size="xs"
              type="button"
              onClick={addBulletItem}
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              Thêm Dòng Mới
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {(!activePlan.bulletFeatures || activePlan.bulletFeatures.length === 0) ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-sub)', fontSize: 12 }}>
                Chưa có dòng quyền lợi marketing nào. Bấm "Thêm Dòng Mới" để tạo.
              </div>
            ) : (
              activePlan.bulletFeatures.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 22 }}>
                    #{idx + 1}
                  </span>

                  {/* Toggle ON/OFF switch for this bullet */}
                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11 }}
                    title={item.isEnabled ? 'Đang hiển thị trên Bảng Giá (Tick xanh)' : 'Đang tạm ẩn'}
                  >
                    <input
                      type="checkbox"
                      checked={item.isEnabled}
                      onChange={(e) => updateBulletItem(item.id, { isEnabled: e.target.checked })}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span style={{ color: item.isEnabled ? 'var(--accent)' : 'var(--text-sub)', fontWeight: 600 }}>
                      {item.isEnabled ? 'Hiện' : 'Ẩn'}
                    </span>
                  </label>

                  {/* Text Input */}
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ flex: 1, opacity: item.isEnabled ? 1 : 0.6 }}
                    value={item.text}
                    onChange={(e) => updateBulletItem(item.id, { text: e.target.value })}
                    placeholder="VD: 30 video Full HD / tháng..."
                  />

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => deleteBulletItem(item.id)}
                    title="Xóa dòng tính năng này"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 6,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 4,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 8 }}>
          <Button
            variant="primary"
            size="md"
            type="button"
            disabled={isSaving}
            onClick={handleSavePlan}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            }
          >
            {isSaving ? 'Đang lưu...' : `Lưu Thay Đổi Gói "${activePlan.name}"`}
          </Button>

          <Button
            variant="danger"
            size="md"
            type="button"
            disabled={isSaving}
            onClick={handleResetDefaults}
          >
            Khôi Phục Mặc Định (Reset Defaults)
          </Button>
        </div>
      </div>
    </div>
  );
};
