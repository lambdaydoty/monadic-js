const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]
const models = require ('../models')

/**
 * middleware for `route parameters`
 */
module.exports = function load ({ model, name }) {
  return (req, res, next, _id) => { // bind `_id`
    const M = middleware ((req, locals) => F.go (function * () {
      const { client } = locals
      const { [model]: m } = models (client) ()
      const doc = yield m.findOne ({ _id })
      return Next ({ ...locals, [name]: doc })
    }))
    return M (req, res, next)
  }
}
