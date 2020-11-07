const ROOT = '..'
const [F, { middleware, Next }, $, { unchecked: S }] = [
  require ('fluture'),
  require ('fluture-express'),
  require ('sanctuary-def'),
  require ('sanctuary'),
]
const V = require ('@rexform/validation')
const { BadTimestamp } = require (`${ROOT}/errors`)

const [Left, Right] = [
  x => Object.assign (S.Left (x), { fold (f, g) { return S.either (f) (g) (this) } }),
  x => Object.assign (S.Right (x), { fold (f, g) { return S.either (f) (g) (this) } }),
]

module.exports = (delta = 5000) => middleware ((req, locals) => F.go (function * () {
  const { body } = req
  const now = Date.now ()

  const typing = x => S.is ($.NonNegativeInteger) (x)
    ? S.Right (x)
    : S.Left ('The `timestamp` must be a unix timestamp')
  const timing = x => Math.abs (x - now) <= delta
    ? S.Right (x)
    : S.Left (`The \`timestamp\` is outside the window ${now}±${delta}`)

  // ∷ Any → Validation [String] NonNegativeInteger
  const timestamp = S.pipe ([
    S.of (S.Either),
    S.chain (typing),
    S.chain (timing),
    S.either (Left) (Right),
    V.fromEither (0),
  ])

  // ∷ a → Validation [String] a
  const bodyValidator = o => V
    .of (o)
    .map (V.validateProperties ({ timestamp }))
    .chain (V.allProperties)

  yield bodyValidator (body)
    .fold (x => F.reject (new BadTimestamp (x)), F.resolve)

  return Next (locals)
}))
