const { go } = require ('momi')
const RA = require ('ramda-adjunct')
const L = require ('partial.lenses')
const { unchecked: S } = require ('sanctuary')

module.exports = go (function * (next) {
  const res = yield next
  const lens = ['body']
  const pipe = S.pipe ([
    JSON.parse,
    RA.renameKeys ({ '_id': 'id' }),
    JSON.stringify,
  ])
  return L.modify
    (lens)
    (pipe)
    (res)
})

// TODO

// module.exports = json (function (body, req, res) {
//   const fn = R.pipe (id, key)
//   return Array.isArray (body)
//     ? body.map (fn)
//     : fn (body)
// })

// function id (doc) {
//   return RA.renameKeys ({ _id: 'id' }) (doc)
// }

// function key (doc) {
//   const isPlainObject = o => (
//     o !== null &&
//     typeof o === 'object' &&
//     o.constructor === Object
//   )
//   const isSensitivePair = ([key, val]) => R.test (/key/i, key)
//   return R.pipe (
//     R.map (R.when (isPlainObject, key)), // recur
//     R.toPairs,
//     R.reject (isSensitivePair),
//     R.fromPairs,
//   ) (doc)
// }
