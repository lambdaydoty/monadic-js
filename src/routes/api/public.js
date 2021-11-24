const express = require ('express')
const F = require ('fluture')
const { middleware, Json } = require ('fluture-express')
const { unchecked: S } = require ('sanctuary')

const Json200 = x => Json (200, x)

module.exports = express
  .Router ()
  .get ('/now', middleware (() => F
    .resolve (new Date ())
    .pipe (F.map (date => Json200 ({
      timestamp: +date,
      isostring: date.toISOString (),
    })))),
  )
  .get ('/stats', middleware (() => {
    const eth = require ('../../services/eth/stats') ()
    const stats = { eth }
    return S.sequence (F.Future) (stats)
      .pipe (F.map (Json200))
  }))
