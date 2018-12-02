const caseVoid = () => { throw new Error('Void') };

const Unit = { _tag: 'Unit' };
const caseUnit = t => _ => t;

const True = { _tag: 'True' };
const False = { _tag: 'False' };
const caseBool = a => b => c => c._tag === 'True' ? a : b;

const Z = { _tag: 'Z' };
const S = x => ({ _tag: 'S', val: x });
const caseNat = z => s => x => x._tag === 'S' ? s(x.val) : z;
