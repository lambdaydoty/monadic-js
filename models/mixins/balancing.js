const { unchecked: S } = require ('sanctuary')
const R = require ('ramda')
const RC = {
  overIf: R.curry ((lens, fn) => R.unless (R.o (R.isNil, R.view (lens)), R.over (lens, fn))),
}

const { Decimal128 } = require ('mongodb')
const d128 = x => Decimal128.fromString (x)

module.exports = _ => o => Object.assign ({}, o, {
  insertOne (doc, opts) {
    const fn = S.pipe ([
      RC.overIf (R.lensProp ('balance'), d128),
      RC.overIf (R.lensProp ('free_balance'), d128),
    ])
    return o.insertOne (fn (doc), opts)
  },
})
