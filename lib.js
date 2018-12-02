const Unit = { _tag: 'Unit' };
const True = { _tag: 'True' };
const False = { _tag: 'False' };

const I = x => x;
const K = x => y => x;
const S = x => y => z => x(z)(y(z));
