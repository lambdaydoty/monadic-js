const express = require ('express')

module.exports = express
  .Router ()
  .use ('/balances', require ('./balances'))
