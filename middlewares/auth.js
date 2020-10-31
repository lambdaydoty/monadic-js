// const { BadAccount, PermissionDenied } = require('../errors')
const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]

module.exports = middleware ((req, locals) => F.go (function * () {
  const { account: user1 } = req
  const { account: user2 } = locals
  if (!user1) yield new Error ('BadAccount1') // new BadAccount()
  if (!user2) yield new Error ('BadAccount2') // new BadAccount()
  if (`${user1}` !== `${user2}`) yield new Error ('PermissionDenied') // throw new PermissionDenied()
  return Next (locals)
}))
