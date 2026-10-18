import { IAlgorithmDefinition, AlgorithmTraceStep } from '../core/types'

// ── 1. Bubble Sort (O(n^2)) ──
export const BubbleSortAlgorithm: IAlgorithmDefinition = {
  id: 'bubble-sort',
  name: 'Bubble Sort (Nổi Bọt)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },
  spaceComplexity: 'O(1)',
  description: 'So sánh từng cặp phần tử liền kề và đổi chỗ nếu sai thứ tự. Cột lớn nhất sẽ từ từ "nổi" lên đỉnh.',
  generateTrace: (arr: number[]): AlgorithmTraceStep[] => {
    const steps: AlgorithmTraceStep[] = []
    const a = [...arr]
    const n = a.length
    let comparisons = 0
    let swaps = 0

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        comparisons++
        // Compare step
        steps.push({
          type: 'compare',
          indices: [j, j + 1],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[j] / n,
        })

        if (a[j] > a[j + 1]) {
          // Swap step
          const temp = a[j]
          a[j] = a[j + 1]
          a[j + 1] = temp
          swaps++

          steps.push({
            type: 'swap',
            indices: [j, j + 1],
            valuesSnapshot: [...a],
            metrics: { comparisons, swaps },
            soundPitch: a[j + 1] / n,
          })
        }
      }
    }

    return steps
  },
}

// ── 2. Quick Sort (O(n log n)) ──
export const QuickSortAlgorithm: IAlgorithmDefinition = {
  id: 'quick-sort',
  name: 'Quick Sort (Sắp Xếp Nhanh)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
  },
  spaceComplexity: 'O(log n)',
  description: 'Chọn một phần tử chốt (Pivot), phân chia mảng thành 2 nửa: nhỏ hơn sang trái, lớn hơn sang phải.',
  generateTrace: (arr: number[]): AlgorithmTraceStep[] => {
    const steps: AlgorithmTraceStep[] = []
    const a = [...arr]
    const n = a.length
    let comparisons = 0
    let swaps = 0

    const partition = (low: number, high: number): number => {
      const pivot = a[high]
      // Highlight pivot
      steps.push({
        type: 'pivot',
        indices: [high],
        valuesSnapshot: [...a],
        metrics: { comparisons, swaps },
        soundPitch: pivot / n,
      })

      let i = low - 1
      for (let j = low; j < high; j++) {
        comparisons++
        steps.push({
          type: 'compare',
          indices: [j, high],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[j] / n,
        })

        if (a[j] < pivot) {
          i++
          if (i !== j) {
            const temp = a[i]
            a[i] = a[j]
            a[j] = temp
            swaps++
            steps.push({
              type: 'swap',
              indices: [i, j],
              valuesSnapshot: [...a],
              metrics: { comparisons, swaps },
              soundPitch: a[i] / n,
            })
          }
        }
      }

      // Place pivot in correct position
      const temp = a[i + 1]
      a[i + 1] = a[high]
      a[high] = temp
      swaps++
      steps.push({
        type: 'swap',
        indices: [i + 1, high],
        valuesSnapshot: [...a],
        metrics: { comparisons, swaps },
        soundPitch: a[i + 1] / n,
      })

      return i + 1
    }

    const quickSortHelper = (low: number, high: number) => {
      if (low < high) {
        const pi = partition(low, high)
        quickSortHelper(low, pi - 1)
        quickSortHelper(pi + 1, high)
      }
    }

    quickSortHelper(0, n - 1)
    return steps
  },
}

// ── 3. Merge Sort (O(n log n)) ──
export const MergeSortAlgorithm: IAlgorithmDefinition = {
  id: 'merge-sort',
  name: 'Merge Sort (Sắp Xếp Trộn)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  description: 'Chia đôi mảng liên tục cho đến khi còn từng phần tử đơn lẻ, sau đó trộn hai nửa đã sắp xếp lại với nhau.',
  generateTrace: (arr: number[]): AlgorithmTraceStep[] => {
    const steps: AlgorithmTraceStep[] = []
    const a = [...arr]
    const n = a.length
    let comparisons = 0
    let swaps = 0

    const merge = (start: number, mid: number, end: number) => {
      const left = a.slice(start, mid + 1)
      const right = a.slice(mid + 1, end + 1)
      let i = 0
      let j = 0
      let k = start

      while (i < left.length && j < right.length) {
        comparisons++
        steps.push({
          type: 'compare',
          indices: [start + i, mid + 1 + j],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: left[i] / n,
        })

        if (left[i] <= right[j]) {
          a[k] = left[i]
          i++
        } else {
          a[k] = right[j]
          j++
        }
        swaps++
        steps.push({
          type: 'overwrite',
          indices: [k],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[k] / n,
        })
        k++
      }

      while (i < left.length) {
        a[k] = left[i]
        swaps++
        steps.push({
          type: 'overwrite',
          indices: [k],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[k] / n,
        })
        i++
        k++
      }

      while (j < right.length) {
        a[k] = right[j]
        swaps++
        steps.push({
          type: 'overwrite',
          indices: [k],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[k] / n,
        })
        j++
        k++
      }
    }

    const mergeSortHelper = (start: number, end: number) => {
      if (start >= end) return
      const mid = Math.floor((start + end) / 2)
      mergeSortHelper(start, mid)
      mergeSortHelper(mid + 1, end)
      merge(start, mid, end)
    }

    mergeSortHelper(0, n - 1)
    return steps
  },
}

// ── 4. Insertion Sort (O(n^2)) ──
export const InsertionSortAlgorithm: IAlgorithmDefinition = {
  id: 'insertion-sort',
  name: 'Insertion Sort (Chèn Trực Tiếp)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },
  spaceComplexity: 'O(1)',
  description: 'Mô phỏng cách xếp bài: Lần lượt lấy từng lá bài và chèn vào đúng vị trí của phần bài đã xếp trước đó.',
  generateTrace: (arr: number[]): AlgorithmTraceStep[] => {
    const steps: AlgorithmTraceStep[] = []
    const a = [...arr]
    const n = a.length
    let comparisons = 0
    let swaps = 0

    for (let i = 1; i < n; i++) {
      let key = a[i]
      let j = i - 1

      steps.push({
        type: 'pivot',
        indices: [i],
        valuesSnapshot: [...a],
        metrics: { comparisons, swaps },
        soundPitch: key / n,
      })

      while (j >= 0 && a[j] > key) {
        comparisons++
        a[j + 1] = a[j]
        swaps++
        steps.push({
          type: 'overwrite',
          indices: [j + 1, j],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[j + 1] / n,
        })
        j = j - 1
      }
      if (j >= 0) {
        comparisons++
      }
      a[j + 1] = key
      swaps++
      steps.push({
        type: 'swap',
        indices: [j + 1],
        valuesSnapshot: [...a],
        metrics: { comparisons, swaps },
        soundPitch: key / n,
      })
    }

    return steps
  },
}

// ── 5. Selection Sort (O(n^2)) ──
export const SelectionSortAlgorithm: IAlgorithmDefinition = {
  id: 'selection-sort',
  name: 'Selection Sort (Chọn Trực Tiếp)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },
  spaceComplexity: 'O(1)',
  description: 'Quét toàn bộ mảng tìm phần tử nhỏ nhất, sau đó hoán đổi nó về vị trí đầu tiên chưa được xếp.',
  generateTrace: (arr: number[]): AlgorithmTraceStep[] => {
    const steps: AlgorithmTraceStep[] = []
    const a = [...arr]
    const n = a.length
    let comparisons = 0
    let swaps = 0

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i
      steps.push({
        type: 'pivot',
        indices: [i],
        valuesSnapshot: [...a],
        metrics: { comparisons, swaps },
        soundPitch: a[i] / n,
      })

      for (let j = i + 1; j < n; j++) {
        comparisons++
        steps.push({
          type: 'compare',
          indices: [minIdx, j],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[j] / n,
        })

        if (a[j] < a[minIdx]) {
          minIdx = j
        }
      }

      if (minIdx !== i) {
        const temp = a[i]
        a[i] = a[minIdx]
        a[minIdx] = temp
        swaps++
        steps.push({
          type: 'swap',
          indices: [i, minIdx],
          valuesSnapshot: [...a],
          metrics: { comparisons, swaps },
          soundPitch: a[i] / n,
        })
      }
    }

    return steps
  },
}
