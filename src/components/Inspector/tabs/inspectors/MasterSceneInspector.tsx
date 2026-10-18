import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, Slider } from './common'
import { SectionHeader, FormGroup, Input, Textarea, Button } from '@/components/ui'
import { getSceneRecipe, validateRecipeSlots, type RecipeSlotDef } from '@/config/sceneRecipes'
import { sceneRoleSpec } from '@/config/sceneRoles'
import { MASTER_SCENE_DEFAULT_WIDTH, MASTER_SCENE_MIN_WIDTH } from '@/config/masterSceneLayout'

/** Gợi ý giới hạn của slot cho tooltip (cùng luật với validateRecipeSlots) */
function slotHint(def: RecipeSlotDef): string {
  switch (def.type) {
    case 'text':
      return `Tối đa ${def.maxWords} từ`
    case 'number':
      return `Con số hiển thị lớn, tối đa ${def.maxChars} ký tự (vd 3, 90%)`
    case 'integer':
      return `Số nguyên từ ${def.min} đến ${def.max}`
    case 'list':
      return `${def.minItems}–${def.maxItems} mục, mỗi dòng một mục, tối đa ${def.maxWords} từ`
  }
}

/**
 * Inspector của cảnh Master: ô nhập sinh từ slot của mẫu (config/sceneRecipes.js), lỗi theo validateRecipeSlots.
 * Thêm mẫu mới không cần viết Inspector mới.
 */
export function MasterSceneInspector({ element, updateElement }: InspectorProps) {
  const data = element.masterSceneData
  const recipe = data ? getSceneRecipe(data.templateId) : null
  if (!data || !recipe) return null

  const slots = data.slots || {}
  const { errors } = validateRecipeSlots(data.templateId, slots)
  const errorFor = (key: string) => errors.find(e => e.startsWith(`${key}:`) || e.startsWith(`${key}[`))?.replace(/^[^:]+:\s*/, '')
  const setSlot = (key: string, value: unknown) =>
    updateElement(element.id, { masterSceneData: { ...data, slots: { ...slots, [key]: value } } })

  return (
    <>
      <SectionHeader title={recipe.name} />
      <div className={styles.propRowVertical}>
        <span className={styles.propLabel}>Vai cảnh: {sceneRoleSpec(recipe.role).label}</span>
      </div>

      {recipe.slots.map(def => {
        const value = slots[def.key]
        const clear = !def.required && value !== undefined && value !== '' ? (
          <Button size="xs" variant="ghost" onClick={() => setSlot(def.key, undefined)}>
            Xoá cho gọn
          </Button>
        ) : undefined

        return (
          <FormGroup key={def.key} label={def.label} tooltip={slotHint(def)} error={errorFor(def.key)} action={clear}>
            {def.type === 'list' ? (
              <Textarea
                rows={Math.max(3, Array.isArray(value) ? value.length : 3)}
                value={Array.isArray(value) ? value.join('\n') : ''}
                onChange={e => setSlot(def.key, e.target.value.split('\n'))}
              />
            ) : def.type === 'integer' ? (
              <Input
                type="number"
                min={def.min}
                max={def.max}
                value={value === undefined ? '' : String(value)}
                onChange={e => setSlot(def.key, e.target.value === '' ? undefined : Number(e.target.value))}
              />
            ) : (
              <Input value={String(value ?? '')} onChange={e => setSlot(def.key, e.target.value)} />
            )}
          </FormGroup>
        )
      })}

      <Slider
        label="Độ rộng"
        value={element.width || MASTER_SCENE_DEFAULT_WIDTH}
        min={MASTER_SCENE_MIN_WIDTH}
        max={340}
        step={2}
        display={v => `${v}px`}
        onChange={v => updateElement(element.id, { width: v })}
      />
    </>
  )
}
