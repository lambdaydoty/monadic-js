const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]
const V = require ('@rexform/validation')
const { BadParameter } = require ('../errors')

module.exports = middleware ((req, locals) => F.go (function * () {
  const { body } = req

  const invalid = es => F.reject (new BadParameter (es.join ('; ')))
  const valid = x => F.resolve (x)

  Object.assign (req, {
    body: yield V.allProperties (body)
      .fold (invalid, valid),
  })

  return Next (locals)
}))
