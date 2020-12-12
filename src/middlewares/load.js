const F = require ('fluture')
const { middleware, Next } = require ('fluture-express')
const models = require ('../models')

/**
 * middleware for `route parameters`
 */
module.exports = function load ({ model, name }) {
  return (req, res, next, _id) => { // bind `_id`
    const M = middleware ((req, locals) => F.go (function * () {
      const { locals: { client } } = req
      const { [model]: m } = models (client) ()
      const doc = yield m.findOne ({ _id })
      Object.assign (req.locals, { [name]: doc })
      return Next (locals)
    }))
    return M (req, res, next)
  }
}
