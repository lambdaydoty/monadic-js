const { fromValidator } = require ('../utils')
const { body } = require ('express-validator')

const printable = /^[\x20-\x7e]*$/

module.exports = fromValidator (
  body ('client_id')
    .matches (printable)
)
