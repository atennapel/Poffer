const caseVoid = () => { throw new Error('Void') };

const Unit = { _tag: 'Unit' };
const caseUnit = t => _ => t;

const True = { _tag: 'True' };
const False = { _tag: 'False' };
const caseBool = a => b => c => c._tag === 'True' ? a : b;
