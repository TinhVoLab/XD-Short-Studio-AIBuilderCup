import { random } from 'remotion';
/**
 * Safe Math Evaluator - Recursive Descent Parser (Zero-Eval)
 * Evaluates mathematical expressions strictly without eval() or Function()
 */

type TokenType = 'NUMBER' | 'IDENT' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'EOF';

interface Token {
  type: TokenType;
  value: string | number;
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
};

const SAFE_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sign: Math.sign,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
};

class Tokenizer {
  private pos = 0;
  private str: string;

  constructor(input: string) {
    this.str = input.trim();
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    const len = this.str.length;

    while (this.pos < len) {
      const ch = this.str[this.pos];

      if (/\s/.test(ch)) {
        this.pos++;
        continue;
      }

      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        this.pos++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        this.pos++;
        continue;
      }

      if (ch === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        this.pos++;
        continue;
      }

      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '%') {
        tokens.push({ type: 'OP', value: ch });
        this.pos++;
        continue;
      }

      // Numbers (e.g. 12, 3.14, .5)
      if (/\d/.test(ch) || (ch === '.' && this.pos + 1 < len && /\d/.test(this.str[this.pos + 1]))) {
        let numStr = '';
        while (this.pos < len && (/[\d.]/.test(this.str[this.pos]))) {
          numStr += this.str[this.pos];
          this.pos++;
        }
        const val = parseFloat(numStr);
        tokens.push({ type: 'NUMBER', value: isNaN(val) ? 0 : val });
        continue;
      }

      // Identifiers (functions or variables)
      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (this.pos < len && /[a-zA-Z0-9_]/.test(this.str[this.pos])) {
          ident += this.str[this.pos];
          this.pos++;
        }
        tokens.push({ type: 'IDENT', value: ident });
        continue;
      }

      // Skip unexpected character
      this.pos++;
    }

    tokens.push({ type: 'EOF', value: '' });
    return tokens;
  }
}

class Parser {
  private tokens: Token[];
  private current = 0;
  private scope: Record<string, number>;

  constructor(tokens: Token[], scope: Record<string, number> = {}) {
    this.tokens = tokens;
    this.scope = scope;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '' };
  }

  private match(type: TokenType, val?: string | number): boolean {
    const t = this.peek();
    if (t.type !== type) return false;
    if (val !== undefined && t.value !== val) return false;
    this.current++;
    return true;
  }

  // Expression: Addition / Subtraction
  public parseExpression(): number {
    let result = this.parseTerm();

    while (true) {
      if (this.match('OP', '+')) {
        result += this.parseTerm();
      } else if (this.match('OP', '-')) {
        result -= this.parseTerm();
      } else {
        break;
      }
    }

    return result;
  }

  // Term: Multiplication / Division / Modulo
  private parseTerm(): number {
    let result = this.parsePower();

    while (true) {
      if (this.match('OP', '*')) {
        result *= this.parsePower();
      } else if (this.match('OP', '/')) {
        const denom = this.parsePower();
        result = denom === 0 ? 0 : result / denom;
      } else if (this.match('OP', '%')) {
        const denom = this.parsePower();
        result = denom === 0 ? 0 : result % denom;
      } else {
        break;
      }
    }

    return result;
  }

  // Power: ^ (Right-associative)
  private parsePower(): number {
    let base = this.parseUnary();

    if (this.match('OP', '^')) {
      const exponent = this.parsePower();
      base = Math.pow(base, exponent);
    }

    return base;
  }

  // Unary: + or -
  private parseUnary(): number {
    if (this.match('OP', '+')) {
      return this.parseUnary();
    }
    if (this.match('OP', '-')) {
      return -this.parseUnary();
    }
    return this.parsePrimary();
  }

  // Primary: Number, Identifier, Function call, Parentheses
  private parsePrimary(): number {
    const token = this.peek();

    if (this.match('NUMBER')) {
      return Number(token.value);
    }

    if (this.match('LPAREN')) {
      const result = this.parseExpression();
      this.match('RPAREN');
      return result;
    }

    if (this.match('IDENT')) {
      const name = String(token.value);

      // Function Call: name(arg1, arg2...)
      if (this.match('LPAREN')) {
        const args: number[] = [];
        if (!this.match('RPAREN')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('COMMA'));
          this.match('RPAREN');
        }

        const fn = SAFE_FUNCTIONS[name];
        if (fn) {
          try {
            const res = fn(...args);
            return isFinite(res) ? res : 0;
          } catch {
            return 0;
          }
        }
        return 0;
      }

      // Constants
      if (name in CONSTANTS) {
        return CONSTANTS[name];
      }

      // Scope variables (e.g. x, t, tau, n)
      if (name in this.scope) {
        const v = this.scope[name];
        return typeof v === 'number' && isFinite(v) ? v : 0;
      }

      return 0;
    }

    return 0;
  }
}

export const safeMathEvaluator = {
  /**
   * Safely evaluate a math expression against a provided scope
   */
  evaluate(expr: string, scope: Record<string, number> = {}): number {
    if (!expr || typeof expr !== 'string') return 0;
    const cleanExpr = expr.trim();
    if (!cleanExpr) return 0;

    try {
      const tokenizer = new Tokenizer(cleanExpr);
      const tokens = tokenizer.tokenize();
      const parser = new Parser(tokens, scope);
      const val = parser.parseExpression();
      return isFinite(val) ? val : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Verify that an expression can be safely tokenized and does not contain dangerous patterns
   */
  validate(expr: string): boolean {
    if (!expr || typeof expr !== 'string') return false;
    const lower = expr.toLowerCase();

    // Dangerous JS keywords check
    const dangerousPatterns = [
      'window',
      'document',
      'process',
      'global',
      'eval',
      'function',
      'constructor',
      'prototype',
      '__proto__',
      'import',
      'export',
      'fetch',
      'xmlhttprequest',
      'require',
    ];

    for (const pat of dangerousPatterns) {
      if (lower.includes(pat)) return false;
    }

    try {
      const tokenizer = new Tokenizer(expr);
      const tokens = tokenizer.tokenize();
      return tokens.length > 1; // At least one token + EOF
    } catch {
      return false;
    }
  },

  /**
   * Deterministic Math Verifier (Phase 4)
   * Samples 10 random points to verify if two expressions are mathematically equivalent.
   * Prevents LLM Math Hallucination.
   */
  verifyEquality(exprLeft: string, exprRight: string, variables: string[] = ['x', 'y']): boolean {
    try {
      if (!this.validate(exprLeft) || !this.validate(exprRight)) return false;

      // Random sampling across a standard domain [-10, 10]
      for (let i = 0; i < 10; i++) {
        const scope: Record<string, number> = {};
        for (const v of variables) {
          // Điểm lấy mẫu có seed (theo biểu thức + biến + lượt) → cùng kết quả ở preview và mọi worker render
          scope[v] = random(`verify-${exprLeft}|${exprRight}|${v}|${i}`) * 20 - 10;
        }

        const valL = this.evaluate(exprLeft, scope);
        const valR = this.evaluate(exprRight, scope);

        // If either is NaN/Infinity in a specific domain, we skip this point (could be asymptote)
        if (!isFinite(valL) || !isFinite(valR)) continue;

        // Epsilon comparison
        if (Math.abs(valL - valR) > 1e-6) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  },
};
