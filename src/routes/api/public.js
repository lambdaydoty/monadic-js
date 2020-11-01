const express = require ('express')
const [F, { middleware, Json }] = [
  require ('fluture'),
  require ('fluture-express'),
]

module.exports = express
  .Router ()
  .get ('/now', middleware ((req, locals) => F
    .resolve (new Date ())
    .pipe (F.map (date => Json (200, {
      timestamp: +date,
      isostring: date.toISOString (),
    })))))
