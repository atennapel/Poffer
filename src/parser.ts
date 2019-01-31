import { Expr, Var, App, NatLit, Thunk } from "./exprs";

const err = (msg: string) => {
  throw new SyntaxError(msg);
};

type Token = TkName | TkNumber | TkParen | TkString | TkCurly;

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
  readonly sigils: string;
}
const TkParen = (tokens: Token[], sigils: string): TkParen => ({ tag: 'TkParen', tokens, sigils });
const isTkParen = (token: Token): token is TkParen => token.tag === 'TkParen';

interface TkCurly {
  readonly tag: 'TkCurly';
  readonly tokens: Token[];
  readonly sigils: string;
}
const TkCurly = (tokens: Token[], sigils: string): TkCurly => ({ tag: 'TkCurly', tokens, sigils });
const isTkCurly = (token: Token): token is TkCurly => token.tag === 'TkCurly';

type Bracket = '(' | ')' | '{' | '}';
const matchingBracket = (c: Bracket): Bracket => {
  if (c === '(') return ')';
  if (c === ')') return '(';
  if (c === '{') return '}';
  if (c === '}') return '{';
  return err(`invalid bracket: ${c}`);
}

const sigils = '#%?';

type BrFrame = { br: Bracket, sg: string };

const START = 0;
const NUM = 1;
const STR = 2;
const tokenize = (s: string): Token[] => {
  let state = START;
  let t = '';
  let r: Token[] = [], p: Token[][] = [], b: BrFrame[] = [], esc = false;
  let sg = '';
  for (let i = 0; i <= s.length; i++) {
    const c = s[i] || ' ';
    const next = s[i+1] || ' ';
    // console.log(i, c, state, t, esc);
    if (state === START) {
      if (sigils.indexOf(c) >= 0) sg += c;
      else if (/[a-z]/i.test(c)) r.push(TkName(sg + c)), sg = '';
      else if (/[0-9]/.test(c)) t += c, state = NUM;
      else if(c === '"') state = STR;
      else if(c === '(' || c === '{') b.push({ br: c, sg }), sg = '', p.push(r), r = [];
      else if(c === ')' || c === '}') {
        if(b.length === 0) return err(`unmatched bracket: ${c}`);
        const brf = b.pop() as BrFrame;
        const br = brf.br;
        if(matchingBracket(br) !== c) return err(`unmatched bracket: ${br} and ${c}`);
        const a: Token[] = p.pop() as Token[];
        if (br === '(') a.push(TkParen(r, brf.sg));
        else if (br === '{') a.push(TkCurly(r, brf.sg));
        r = a;
      } else if(/\s+/.test(c)) continue;
      else return err(`invalid char: ${c}`);
    } else if (state === NUM) {
      if(!/[0-9\.]/.test(c)) r.push(sg ? TkName(sg + t) : TkNumber(t)), sg = '', t = '', i--, state = START;
      else t += c;
    } else if (state === STR) {
      if (esc) { esc = false; t += c }
      else if (c === '\\') esc = true;
      else if (c === '"') r.push(TkString(t)), sg = '', t = '', state = START;
      else t += c;
    }
  }
  if (b.length > 0) return err(`unclosed brackets: ${b.map(x => x.br).join(' ')}`);
  if (state === STR) return err('unclosed string');
  if (state !== START) return err(`invalid parsing end state: ${state}`);
  if (sg) return err(`sigils ${sg} before whitespace`);
  return r;
};

const parseToken = (t: Token, sg: string): Expr => {
  if (isTkName(t)) return Var(sg + t.name);
  if (isTkNumber(t)) return sg ? Var(sg + t.val) : NatLit(t.val);
  if (isTkParen(t)) return parseParen(t.tokens, t.sigils);
  if (isTkCurly(t)) return Thunk(parseParen(t.tokens, t.sigils));
  return err(`invalid token: ${t.tag}`);
};

const parseParen = (ts: Token[], sg: string): Expr =>
  ts.length === 0 ? Var(sg + 'u') :
  ts.length === 1 ? parseToken(ts[0], sg) :
  ts.map(x => parseToken(x, sg)).reduce(App);

export const parse = (s: string): Expr => parseParen(tokenize(s), '');
