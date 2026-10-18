import React from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorDot, Slider, ToggleRow, Toggle, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common';
import { Select, Button, SectionHeader } from '@/components/ui';
import { ChecklistItem } from '@/types/scene';

export function ChecklistInspector({ element, updateElement, showToast }: InspectorProps) {
  const currentData = element.checklistData || { items: [] };
  const items: ChecklistItem[] = (element.checklistItems && element.checklistItems.length > 0)
    ? element.checklistItems
    : (currentData.items && currentData.items.length > 0)
      ? currentData.items
      : [
          { text: 'Xác thực 2 lớp (2FA)', subtext: 'Bảo vệ tài khoản tối đa', status: 'checked' },
          { text: 'Không click link lạ', subtext: 'Tránh mã độc & phishing', status: 'checked' },
          { text: 'Dùng mật khẩu đơn giản', subtext: 'Dễ bị tấn công', status: 'cross' }
        ];

  const title = currentData.title || element.content || 'CHECKLIST QUAN TRỌNG';
  const badge = currentData.badge || 'ACTION LIST';
  const styleVariant = currentData.style || 'glass';
  const isTickAnim = currentData.tickAnimation !== false;
  const showFooter = currentData.showFooter !== false;

  const saveItems = (newItems: ChecklistItem[]) => {
    updateElement(element.id, {
      checklistData: { ...currentData, items: newItems },
      checklistItems: newItems
    });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    saveItems(newItems);
  };

  const handleDuplicateItem = (index: number) => {
    const newItems = [...items];
    const cloned = { ...items[index], text: `${items[index].text} (Sao chép)` };
    newItems.splice(index + 1, 0, cloned);
    saveItems(newItems);
    showToast('Đã nhân bản mục');
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Danh sách kiểm tra (Checklist)" />

        {/* Title */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 10.5 }}>Tiêu đề</span>
            {Boolean(title) && (
              <button
                type="button"
                onClick={() => {
                  updateElement(element.id, {
                    content: '',
                    checklistData: { ...currentData, title: '' }
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Xoá cho gọn
              </button>
            )}
          </div>
          <input
            className={styles.input}
            value={title}
            onChange={e => {
              updateElement(element.id, {
                content: e.target.value,
                checklistData: { ...currentData, title: e.target.value }
              });
            }}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Visual Style Selector */}
        <div style={{ marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 10.5 }}>Phong cách hiển thị</span>
          <Select
            size="sm"
            fullWidth
            value={styleVariant}
            options={[
              { value: 'glass', label: 'Kính mờ Neon (Glass)' },
              { value: 'minimal', label: 'Tối giản thanh lịch (Minimal)' },
              { value: 'audit', label: 'Kiểm định Đạt vs Tránh (Audit)' },
              { value: 'cyber', label: 'Công nghệ tương lai (Cyber)' }
            ]}
            onChange={(val) => {
              updateElement(element.id, {
                checklistData: { ...currentData, style: val as any }
              });
            }}
          />
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 10 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 10.5 }}>Mẫu nội dung nhanh</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newItems: ChecklistItem[] = [
                  { text: 'Xác thực 2 lớp (2FA)', subtext: 'Bảo vệ tài khoản tối đa', status: 'checked' },
                  { text: 'Không click link lạ', subtext: 'Tránh mã độc & phishing', status: 'checked' },
                  { text: 'Dùng mật khẩu đơn giản', subtext: 'Dễ bị lộ thông tin', status: 'cross' }
                ];
                updateElement(element.id, {
                  content: 'AN TOÀN BẢO MẬT',
                  checklistData: {
                    ...currentData,
                    title: 'AN TOÀN BẢO MẬT',
                    items: newItems
                  },
                  checklistItems: newItems
                });
              }}
            >
              Bảo mật
            </Button>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newItems: ChecklistItem[] = [
                  { text: 'Hook gây sốc 3s đầu', subtext: 'Giữ chân người xem ngay', status: 'checked' },
                  { text: 'Phụ đề chuyển động lớn', subtext: 'Xem được khi tắt âm thanh', status: 'checked' },
                  { text: 'Kêu gọi hành động rõ', subtext: 'Tăng tương tác follow', status: 'checked' }
                ];
                updateElement(element.id, {
                  content: 'CÔNG THỨC VIRAL HOOK',
                  checklistData: {
                    ...currentData,
                    title: 'CÔNG THỨC VIRAL HOOK',
                    items: newItems
                  },
                  checklistItems: newItems
                });
              }}
            >
              Viral Video
            </Button>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newItems: ChecklistItem[] = [
                  { text: 'Bước 1: Chuẩn bị dữ liệu', subtext: 'Thu thập thông tin chính xác', status: 'checked' },
                  { text: 'Bước 2: Xử lý quy trình', subtext: 'Thực hiện theo tiêu chuẩn', status: 'checked' },
                  { text: 'Bước 3: Bỏ qua kiểm tra', subtext: 'Nguy cơ gây lỗi hệ thống', status: 'cross' }
                ];
                updateElement(element.id, {
                  content: 'QUY TRÌNH 3 BƯỚC',
                  checklistData: {
                    ...currentData,
                    title: 'QUY TRÌNH 3 BƯỚC',
                    items: newItems
                  },
                  checklistItems: newItems
                });
              }}
            >
              Quy trình
            </Button>
          </div>
        </div>

        {/* Checklist Items Editor */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11, fontWeight: 700 }}>Danh sách mục ({items.length})</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newItems: ChecklistItem[] = [...items, { text: `Mục ${items.length + 1}`, subtext: 'Mô tả chi tiết', status: 'checked' }];
                saveItems(newItems);
              }}
            >
              + Thêm mục
            </Button>
          </div>

          <div style={{ maxHeight: 210, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
            {items.map((item, itIdx) => (
              <div key={itIdx} style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Main Row: Status + Title + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <select
                    className={styles.select}
                    style={{ width: 68, marginBottom: 0, padding: '2px 4px', fontSize: 10.5 }}
                    value={item.status || 'checked'}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[itIdx] = { ...newItems[itIdx], status: e.target.value as any };
                      saveItems(newItems);
                    }}
                  >
                    <option value="checked">Đạt</option>
                    <option value="cross">Tránh</option>
                    <option value="warning">Lưu ý</option>
                  </select>

                  <input
                    style={{ flex: 1, fontSize: 10.5, padding: '3px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 4, minWidth: 0 }}
                    value={item.text}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[itIdx] = { ...newItems[itIdx], text: e.target.value };
                      saveItems(newItems);
                    }}
                    placeholder="Nội dung mục"
                  />

                  {/* Reorder Buttons */}
                  <Button
                    asIcon
                    variant="ghost"
                    size="icon-xs"
                    disabled={itIdx === 0}
                    onClick={() => handleMoveItem(itIdx, 'up')}
                    title="Di chuyển lên"
                  >
                    ↑
                  </Button>
                  <Button
                    asIcon
                    variant="ghost"
                    size="icon-xs"
                    disabled={itIdx === items.length - 1}
                    onClick={() => handleMoveItem(itIdx, 'down')}
                    title="Di chuyển xuống"
                  >
                    ↓
                  </Button>

                  {/* Duplicate Button */}
                  <Button
                    asIcon
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDuplicateItem(itIdx)}
                    title="Nhân bản mục này"
                  >
                    +
                  </Button>

                  {/* Delete Button */}
                  <DeleteIconButton
                    disabled={items.length <= 1}
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== itIdx);
                      saveItems(newItems);
                    }}
                    title="Xóa mục này"
                   />
                </div>

                {/* Subtext Row */}
                <input
                  style={{ width: '100%', fontSize: 9.5, padding: '2px 6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', borderRadius: 4, boxSizing: 'border-box' }}
                  value={item.subtext || ''}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[itIdx] = { ...newItems[itIdx], subtext: e.target.value };
                    saveItems(newItems);
                  }}
                  placeholder="Mô tả phụ (không bắt buộc)"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Toggles: Live Tick Animation & Progress Footer */}
        <div style={{ marginBottom: 6 }}>
          <ToggleRow label="Hoạt ảnh tích động (Live Tick)">
            <Toggle
              checked={isTickAnim}
              onChange={(val: boolean) => {
                updateElement(element.id, {
                  checklistData: { ...currentData, tickAnimation: val }
                });
              }}
            />
          </ToggleRow>
        </div>

        <div style={{ marginBottom: 8 }}>
          <ToggleRow label="Chân trang tiến độ hoàn thành">
            <Toggle
              checked={showFooter}
              onChange={(val: boolean) => {
                updateElement(element.id, {
                  checklistData: { ...currentData, showFooter: val }
                });
              }}
            />
          </ToggleRow>
        </div>

        {/* Màu sắc & Khung nền */}
        <ColorControlRow
          label="Màu chủ đạo"
          value={element.accentColor || '#BEFF01'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền danh sách"
          showWidth={true}
          showBgColor={true}
          showRadius={true}
          defaultRadius={16}
          defaultBgColor="rgba(10, 16, 28, 0.95)"
        />
      </div>
      <div className={styles.divider} />
    </>
  );
}

