import { Expr, Var, appFrom, Abs, App } from './exprs';
import { any } from './utils';

function matchingBracket(c: string) {
  if(c === '(') return ')';
  if(c === ')') return '(';
  if(c === '{') return '}';
  if(c === '}') return '{';
  if(c === '[') return ']';
  if(c === ']') return '[';
  return '';
}

type Bracket = '[' | '{' | '(';

type Token
  = { tag: 'name', val: string }
  | { tag: 'number', val: number }
  | { tag: 'list', val: Token[], br: Bracket };

const START = 0;
const NAME = 1;
const NUMBER = 2;

function tokenize(s: string): Token[] {
  let state = START;
  let t = '';
  let r: Token[] = [], p: Token[][] = [], b: Bracket[] = [];
  for (let i = 0; i <= s.length; i++) {
    const c = s[i] || ' ';
    if (state === START) {
      if (/[a-z\:\_]/i.test(c)) t += c, state = NAME;
      else if (/[0-9]/.test(c)) t += c, state = NUMBER;
      else if(c === '(' || c === '{' || c === '[') b.push(c), p.push(r), r = [];
      else if(c === ')' || c === '}' || c === ']') {
        if(b.length === 0) throw new SyntaxError(`unmatched bracket: ${c}`);
        const br = b.pop() as Bracket;
        if(matchingBracket(br) !== c) throw new SyntaxError(`unmatched bracket: ${br} and ${c}`);
        const a: Token[] = p.pop() as Token[];
        a.push({ tag: 'list', val: r, br });
        r = a;
      } else if(/\s+/.test(c)) continue;
      else throw new SyntaxError(`invalid char: ${c}`);
    } else if (state === NAME) {
      if(!/[a-z0-9\_\!]/i.test(c)) r.push({ tag: 'name', val: t }), t = '', i--, state = START;
      else t += c;
    } else if (state === NUMBER) {
      if(!/[0-9]/.test(c)) r.push({ tag: 'number', val: parseInt(t, 10) }), t = '', i--, state = START;
      else t += c;
    }
  }
  if(state !== START) throw new SyntaxError(`invalid parsing end state: ${state}`);
  return r;
}

function exprs(r: Token[], br: Bracket = '['): Expr {
  switch(br) {
    case '(': return r.length === 0 ? Var('Unit') : r.length === 1 ? expr(r[0]) : appFrom(r.map(expr));
    case '[': throw SyntaxError('unimplemented [] groups');
    case '{':
      if (r.length === 0) return Abs('x', Var('x'));
      if (r.length === 1) return Abs('_', expr(r[0]));
      const args = r[0];
      if (args.tag !== 'list' || args.br !== '[' || args.val.length === 0) return Abs('_', exprs(r, '('));
      if (any(args.val, a => a.tag !== 'name')) throw new SyntaxError(`invalid args: ${args.val.join(' ')}`);
      return args.val.reduceRight((b, n) => Abs(n.val as string, b), exprs(r.slice(1), '('));
  }
}

function expr(r: Token): Expr {
  switch(r.tag) {
    case 'name': return Var(r.val);
    case 'number':
      let c: Expr = Var('Zero');
      for(let i = 0; i < r.val; i ++) c = App(Var('Succ'), c);
      return c;
    case 'list': return exprs(r.val, r.br);
  }
}

export default function parse(s: string): Expr {
  return exprs(tokenize(s), '(');
}
