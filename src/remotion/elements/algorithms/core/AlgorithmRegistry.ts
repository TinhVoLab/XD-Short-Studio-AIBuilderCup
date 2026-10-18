import { IAlgorithmDefinition, AlgorithmBattleLaneConfig } from './types'
import {
  QuickSortAlgorithm,
  BubbleSortAlgorithm,
  MergeSortAlgorithm,
  InsertionSortAlgorithm,
  SelectionSortAlgorithm,
} from '../presets/SortingPresets'

export interface IAlgorithmPresetScenario {
  id: string
  name: string
  description: string
  mode: 'single' | 'battle'
  algorithmId?: string
  battleLanes?: AlgorithmBattleLaneConfig[]
  defaultArraySize?: number
  defaultSpeed?: number
  accentColor?: string
}

export class AlgorithmRegistry {
  private static algorithms: Map<string, IAlgorithmDefinition> = new Map([
    [QuickSortAlgorithm.id, QuickSortAlgorithm],
    [BubbleSortAlgorithm.id, BubbleSortAlgorithm],
    [MergeSortAlgorithm.id, MergeSortAlgorithm],
    [InsertionSortAlgorithm.id, InsertionSortAlgorithm],
    [SelectionSortAlgorithm.id, SelectionSortAlgorithm],
  ])

  private static scenarios: Map<string, IAlgorithmPresetScenario> = new Map([
    [
      'quick-vs-bubble',
      {
        id: 'quick-vs-bubble',
        name: 'Đại Chiến Tốc Độ: Quick Sort vs Bubble Sort',
        description: 'So sánh trực quan sức mạnh thuật toán O(n log n) chớp nhoáng đối đầu thuật toán O(n²) chậm chạp.',
        mode: 'battle',
        battleLanes: [
          { algorithmId: 'quick-sort', label: 'QUICK SORT O(N LOG N)', accentColor: '#00D4FF' },
          { algorithmId: 'bubble-sort', label: 'BUBBLE SORT O(N²)', accentColor: '#FF6B6B' },
        ],
        defaultArraySize: 24,
        defaultSpeed: 1.0,
        accentColor: '#00D4FF',
      },
    ],
    [
      'trio-battle',
      {
        id: 'trio-battle',
        name: 'Tam Hùng Thuật Toán: Quick vs Merge vs Bubble',
        description: 'Cuộc đua 3 làn: Hai đại diện O(n log n) so tài cùng kẻ về bét Bubble Sort O(n²).',
        mode: 'battle',
        battleLanes: [
          { algorithmId: 'quick-sort', label: 'QUICK SORT', accentColor: '#00D4FF' },
          { algorithmId: 'merge-sort', label: 'MERGE SORT', accentColor: '#BEFF01' },
          { algorithmId: 'bubble-sort', label: 'BUBBLE SORT', accentColor: '#FF6B6B' },
        ],
        defaultArraySize: 20,
        defaultSpeed: 1.0,
        accentColor: '#BEFF01',
      },
    ],
    [
      'insertion-vs-selection',
      {
        id: 'insertion-vs-selection',
        name: 'Đại Chiến O(n²): Insertion Sort vs Selection Sort',
        description: 'Hai thuật toán cùng độ phức tạp lý thuyết nhưng ai sẽ ít phép đổi chỗ (swaps) hơn trên thực tế?',
        mode: 'battle',
        battleLanes: [
          { algorithmId: 'insertion-sort', label: 'INSERTION SORT O(N²)', accentColor: '#FFD700' },
          { algorithmId: 'selection-sort', label: 'SELECTION SORT O(N²)', accentColor: '#A855F7' },
        ],
        defaultArraySize: 24,
        defaultSpeed: 1.0,
        accentColor: '#FFD700',
      },
    ],
    [
      'single-quick-sort',
      {
        id: 'single-quick-sort',
        name: 'Chi Tiết Thuật Toán: Quick Sort Chuyên Sâu',
        description: 'Quan sát từng bước phân chia Pivot và đổi chỗ chi tiết của thuật toán phổ biến nhất thế giới.',
        mode: 'single',
        algorithmId: 'quick-sort',
        defaultArraySize: 28,
        defaultSpeed: 0.8,
        accentColor: '#00D4FF',
      },
    ],
    [
      'single-merge-sort',
      {
        id: 'single-merge-sort',
        name: 'Chi Tiết Thuật Toán: Merge Sort Chia Để Trị',
        description: 'Quan sát cơ chế chia nhỏ đệ quy và trộn hai nửa mảng đã sắp xếp cực kỳ mượt mà.',
        mode: 'single',
        algorithmId: 'merge-sort',
        defaultArraySize: 28,
        defaultSpeed: 0.8,
        accentColor: '#BEFF01',
      },
    ],
  ])

  public static getAlgorithm(id: string): IAlgorithmDefinition | undefined {
    return this.algorithms.get(id) || this.algorithms.get('quick-sort')
  }

  public static getAllAlgorithms(): IAlgorithmDefinition[] {
    return Array.from(this.algorithms.values())
  }

  public static getScenario(id: string): IAlgorithmPresetScenario | undefined {
    return this.scenarios.get(id) || this.scenarios.get('quick-vs-bubble')
  }

  public static getAllScenarios(): IAlgorithmPresetScenario[] {
    return Array.from(this.scenarios.values())
  }

  public static registerAlgorithm(algo: IAlgorithmDefinition) {
    this.algorithms.set(algo.id, algo)
  }

  public static registerScenario(scen: IAlgorithmPresetScenario) {
    this.scenarios.set(scen.id, scen)
  }
}
