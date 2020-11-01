const [R, RA] = [
  require ('ramda'),
  require ('ramda-adjunct'),
]
const { json } = require ('express-mung')

module.exports = json (function (body, req, res) {
  const fn = R.pipe (id, key)

  return Array.isArray (body)
    ? body.map (fn)
    : fn (body)
})

function id (doc) {
  return RA.renameKeys ({ _id: 'id' }) (doc)
}

function key (doc) {
  const isPlainObject = o => (
    o !== null &&
    typeof o === 'object' &&
    o.constructor === Object
  )
  const isSensitivePair = ([key, val]) => R.test (/key/i, key)
  return R.pipe (
    R.map (R.when (isPlainObject, key)), // recur
    R.toPairs,
    R.reject (isSensitivePair),
    R.fromPairs,
  ) (doc)
}
