const F = require ('fluture')
const { go, get, lift } = require ('momi')
const { BadAccount, PermissionDenied } = require ('../errors')

module.exports = go (function * (next) {
  const req = yield get
  const { account: user1 } = req
  const { locals: { account: user2 } } = req
  if (!user1) yield lift (F.reject (new BadAccount ()))
  if (!user2) yield lift (F.reject (new BadAccount ()))
  if ('' + user1 !== '' + user2) yield lift (F.reject (new PermissionDenied ()))
  return yield next
})
