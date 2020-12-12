const F = require ('fluture')
const { go, get, lift } = require ('momi')
const { validationResult } = require ('express-validator')
const { ValidationFailed } = require ('../errors')

module.exports = go (function * (next) {
  const req = yield get
  const formatter = ({ location, msg, param }) => `${location} ${param}: ${msg}`
  const result = validationResult (req).formatWith (formatter)
  if (!result.isEmpty ()) yield lift (F.reject (new ValidationFailed (`${result.array ()}`)))
  return yield next
})
