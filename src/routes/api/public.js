const express = require ('express')
const [F, { middleware, Json }, { unchecked: S }] = [
  require ('fluture'),
  require ('fluture-express'),
  require ('sanctuary'),
]

const Json200 = x => Json (200, x)

module.exports = express
  .Router ()
  .get ('/now', middleware ((req, locals) => F
    .resolve (new Date ())
    .pipe (F.map (date => Json200 ({
      timestamp: +date,
      isostring: date.toISOString (),
    })))),
  )
  .get ('/stats', middleware ((req, locals) => {
    const eth = require ('../../services/eth/stats') ()
    const stats = { eth }
    return S.sequence (F.Future) (stats)
      .pipe (F.map (Json200))
  }))
