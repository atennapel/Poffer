import { Expr, Var, App, NatLit } from "./exprs";

const err = (msg: string) => {
  throw new SyntaxError(msg);
};

type Token = TkName | TkNumber | TkParen | TkString;

interface TkName {
  readonly tag: 'TkName';
  readonly name: string;
}
const TkName = (name: string): TkName => ({ tag: 'TkName', name });
const isTkName = (token: Token): token is TkName => token.tag === 'TkName';

interface TkNumber {
  readonly tag: 'TkNumber';
  readonly val: string;
}
const TkNumber = (val: string): TkNumber => ({ tag: 'TkNumber', val });
const isTkNumber = (token: Token): token is TkNumber => token.tag === 'TkNumber';

interface TkString {
  readonly tag: 'TkString';
  readonly val: string;
}
const TkString = (val: string): TkString => ({ tag: 'TkString', val });
const isTkString = (token: Token): token is TkString => token.tag === 'TkString';

interface TkParen {
  readonly tag: 'TkParen';
  readonly tokens: Token[];
}
const TkParen = (tokens: Token[]): TkParen => ({ tag: 'TkParen', tokens });
const isTkParen = (token: Token): token is TkParen => token.tag === 'TkParen';

type Bracket = '(' | ')';
const matchingBracket = (c: Bracket): Bracket => {
  if(c === '(') return ')';
  if(c === ')') return '(';
  return err(`invalid bracket: ${c}`);
}

const START = 0;
const NUM = 1;
const STR = 2;
const tokenize = (s: string): Token[] => {
  let state = START;
  let t = '';
  let r: Token[] = [], p: Token[][] = [], b: Bracket[] = [], esc = false;
  for (let i = 0; i <= s.length; i++) {
    const c = s[i] || ' ';
    const next = s[i+1] || ' ';
    // console.log(i, c, state, t, esc);
    if (state === START) {
      if (/[a-z]/i.test(c)) r.push(TkName(c));
      else if (/[0-9]/.test(c)) t += c, state = NUM;
      else if(c === '"') state = STR;
      else if(c === '(') b.push(c), p.push(r), r = [];
      else if(c === ')') {
        if(b.length === 0) return err(`unmatched bracket: ${c}`);
        const br = b.pop() as Bracket;
        if(matchingBracket(br) !== c) return err(`unmatched bracket: ${br} and ${c}`);
        const a: Token[] = p.pop() as Token[];
        a.push(TkParen(r));
        r = a;
      } else if(/\s+/.test(c)) continue;
      else return err(`invalid char: ${c}`);
    } else if (state === NUM) {
      if(!/[0-9\.]/.test(c)) r.push(TkNumber(t)), t = '', i--, state = START;
      else t += c;
    } else if (state === STR) {
      if (esc) { esc = false; t += c }
      else if (c === '\\') esc = true;
      else if (c === '"') r.push(TkString(t)), t = '', state = START;
      else t += c;
    }
  }
  if (b.length > 0) return err(`unclosed brackets: ${b.join(' ')}`);
  if (state === STR) return err('unclosed string');
  if (state !== START) return err(`invalid parsing end state: ${state}`);
  return r;
};

const parseToken = (t: Token): Expr => {
  if (isTkName(t)) return Var(t.name);
  if (isTkNumber(t)) return NatLit(t.val);
  if (isTkParen(t)) return parseParen(t.tokens);
  return err(`invalid token: ${t.tag}`);
};

const parseParen = (ts: Token[]): Expr =>
  ts.length === 0 ? Var('u') :
  ts.length === 1 ? parseToken(ts[0]) :
  ts.map(parseToken).reduce(App);

export const parse = (s: string): Expr => parseParen(tokenize(s));
