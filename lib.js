const Y = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)));

const caseVoid = () => { throw new Error('Void') };

const Unit = { _tag: 'Unit' };
const caseUnit = t => _ => t;

const True = { _tag: 'True' };
const False = { _tag: 'False' };
const caseBool = a => b => c => c._tag === 'True' ? a : b;

const Zero = { _tag: 'Zero' };
const Succ = x => ({ _tag: 'Succ', val: x });
const caseNat = z => s => x => x._tag === 'Succ' ? s(x.val) : z;
