const express = require ('express')

module.exports = express
  .Router ()
  .use ('/api', require ('./api'))
