const express = require ('express')
const { load } = require ('../../middlewares')

module.exports = express
  .Router ()
  .use ('/balances', require ('./balances'))
  .param ('currency', load ({ model: 'Currency', name: 'currency' }))
  .use ('/:currency', require ('./currencied'))
