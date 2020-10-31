const express = require ('express')
const models = require ('../../mongodb/models')

const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]

module.exports = express
  .Router ()
  .use (require ('./public'))
  .param ('account', load ({ model: 'Account', name: 'account' }))
  .use ('/:account', require ('./accounted'))

function load ({ model, name }) {
  return (req, res, next, _id) => { // bind `_id`
    const M = middleware ((req, locals) => F.go (function * () {
      const { client } = locals
      const { [model]: m } = models (client) ()
      const doc = yield m.findOne ({ _id })
      Object.assign (req, { [name]: doc })
      return Next (locals)
    }))
    return M (req, res, next)
  }
}
