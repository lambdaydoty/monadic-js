const RA = require ('ramda-adjunct')
// const { json } = require ('express-mung')
const mung = require ('express-mung')

module.exports = mung.json (function (body, req, res) {
  function id (doc) {
    return RA.renameKeys ({ _id: 'id' }) (doc)
  }

  const fn = id

  return Array.isArray (body)
    ? body.map (fn)
    : fn (body)
})
