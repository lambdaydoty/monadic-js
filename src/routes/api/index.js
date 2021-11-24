const express = require ('express')
// const bodyParser = require ('body-parser')
const { load } = require ('../../middlewares')

module.exports = express
  .Router ()
  .use (require ('./public'))
  // .use ('/graphql', bodyParser.json (), graphqlExpress ({ schema }))
  .param ('account', load ({ model: 'Account', name: 'account' }))
  .use ('/:account', require ('./accounted'))
