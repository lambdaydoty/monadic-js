const express = require ('express')
const { load } = require ('../../middlewares')

module.exports = express
  .Router ()
  .use (require ('./public'))
  .param ('account', load ({ model: 'Account', name: 'account' }))
  .use ('/:account', require ('./accounted'))
