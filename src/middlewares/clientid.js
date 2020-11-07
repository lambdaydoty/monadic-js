const ROOT = '..'
const [F, { middleware, Next }, $, { unchecked: S }] = [
  require ('fluture'),
  require ('fluture-express'),
  require ('sanctuary-def'),
  require ('sanctuary'),
]
const V = require ('@rexform/validation')
const { BadParameter } = require (`${ROOT}/errors`)
// const { isprint } = require('../utils')

const [Left, Right] = [
  x => Object.assign (S.Left (x), { fold (f, g) { return S.either (f) (g) (this) } }),
  x => Object.assign (S.Right (x), { fold (f, g) { return S.either (f) (g) (this) } }),
]

module.exports = middleware ((req, locals) => F.go (function * () {
  const { body } = req

  console.log ({ body })
  const typing = x => S.is ($.NonEmpty ($.String)) (x)
    ? S.Right (x)
    : S.Left ('The `client_id` must be a string')
  const printing = x => x // TODO
    ? S.Right (x)
    : S.Left (`The \`client_id\` must be printable`)

  // ∷ Any → Validation [String] NonNegativeInteger
  const clientid = S.pipe ([
    S.of (S.Either),
    S.chain (typing),
    S.chain (printing),
    S.either (Left) (Right),
    V.fromEither (''),
  ])

  yield V.of (body)
    .map (V.validateProperties ({ client_id: clientid }))
    .chain (V.allProperties)
    .fold (x => F.reject (new BadParameter (x)), F.resolve)

  return Next (locals)
}))
