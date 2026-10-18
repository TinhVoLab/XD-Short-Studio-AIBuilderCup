import { API_BASE } from '@/config/api'

export interface ResolvedCompound {
  cid: number
  smiles: string
  formula: string
  title: string
}

/**
 * Tra phân tử theo tên tiếng Anh / IUPAC qua server (PubChem, có cache).
 * null = không có trên PubChem; ném lỗi khi mạng hoặc PubChem gặp sự cố.
 */
export async function resolveChemByName(name: string): Promise<ResolvedCompound | null> {
  const res = await fetch(`${API_BASE}/api/chem/resolve?name=${encodeURIComponent(name.trim())}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Không tra được PubChem, thử lại sau')
  const data = await res.json()
  return data?.compound || null
}
