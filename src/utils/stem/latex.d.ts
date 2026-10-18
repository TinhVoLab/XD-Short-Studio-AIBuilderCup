export declare function normalizeLatex(raw: string | undefined): string
export declare function validateLatex(raw: string | undefined): { ok: boolean; latex: string; error: string | null }
export declare function renderLatexHtml(raw: string | undefined, opts?: { displayMode?: boolean }): string | null
