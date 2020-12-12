const { unchecked: S } = require ('sanctuary')

const names = [
  'clientid',
]

module.exports = S.fromPairs
  (S.ap
    (S.zip)
    (S.map (n => require ('./' + n)))
    (names))
