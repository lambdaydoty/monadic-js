const express = require ('express')

module.exports = express
  .Router ()
  .use (require ('./public'))
