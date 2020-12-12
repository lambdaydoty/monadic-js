const { go, get, lift } = require ('momi')
const F = require ('fluture')
const S = require ('sanctuary')
const $ = require ('sanctuary-def')
const { BadTimestamp } = require ('../errors')

const delta = 5000

const inWindow = delta => now => value => (
  now - delta <= value &&
  now + delta >= value
)

module.exports = go (function * (next) {
  const req = yield get
  const { locals: { now } } = req
  const { body: { timestamp } } = req

  if (
    !S.is ($.NonNegativeInteger) (timestamp) ||
    !inWindow (delta) (now) (timestamp)
  ) {
    yield lift (F.reject (new BadTimestamp ()))
  }

  return yield next
})
