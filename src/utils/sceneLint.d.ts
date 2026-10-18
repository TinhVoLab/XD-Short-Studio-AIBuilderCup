export interface SceneLintIssue {
  sceneIdx: number
  elementId: string | null
  field: string
  text: string
}

export declare function findPlaceholders(text: string | undefined): string[]
export declare function lintElementText(el: Record<string, any>): { field: string; text: string }[]
export declare function lintScenesText(scenes: Array<Record<string, any>> | undefined): SceneLintIssue[]
export declare function describeLintIssues(issues: SceneLintIssue[]): string
