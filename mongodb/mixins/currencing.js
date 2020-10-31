const F = require ('fluture')

module.exports = _ => o => Object.assign ({}, o, {
  coin (currency) {
    return currency.base
      ? o.findOne ({ _id: currency.base })
      : F.resolve (currency)
  },

  activeCoins () {
    return o.aggregate ([
      { $match: { status: 'active', base: null } },
      { $sort: { _id: 1 } },
    ])
  },
})
