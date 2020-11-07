const [R, F, { middleware, Next }, $, { unchecked: S }] = [
  require ('ramda'),
  require ('fluture'),
  require ('fluture-express'),
  require ('sanctuary-def'),
  require ('sanctuary'),
]
const V = require ('@rexform/validation')
// const ROOT = '..'
// const { BadParameter } = require (`${ROOT}/errors`)
// const { isprint } = require('../utils')

const [Left, Right] = [
  x => Object.assign (S.Left (x), { fold (f, g) { return S.either (f) (g) (this) } }),
  x => Object.assign (S.Right (x), { fold (f, g) { return S.either (f) (g) (this) } }),
]

module.exports = middleware ((req, locals) => {
  const { body } = req

  const typing = x => S.is ($.NonEmpty ($.String)) (x)
    ? S.Right (x)
    : S.Left ('The `client_id` must be a printable string')
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

  Object.assign (req, {
    body: R.over (R.lensProp ('client_id')) (clientid) (body),
  })

  return F.resolve (Next (locals))
})
