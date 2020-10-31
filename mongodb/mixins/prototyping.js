const F = require ('fluture')

module.exports = _ => o => Object.assign ({}, o, {
  findOne (query, options) {
    return o.findOne (query, options)
      .pipe (F.map (proto))
  },
})

function proto (doc) {
  return Object.assign (Object.create ({
    toString () { return `${this._id}` },
    valueOf () { return +this._id },
  }), doc)
}
