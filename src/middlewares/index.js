const { unchecked: S } = require ('sanctuary')

const names = [
  'escape',
  'load',
  'token',
  'auth',
  'timing',
  'transaction',
  'validateAll',
]

module.exports = S.fromPairs
  (S.ap
    (S.zip)
    (S.map (n => require ('./' + n)))
    (names))
