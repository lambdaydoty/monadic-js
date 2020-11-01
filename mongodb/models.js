// const F = require ('fluture')
// const R = require ('ramda')
const { unchecked: S } = require ('sanctuary')
const {
  prototyping,
  balancing,
  currencing,
} = require ('./mixins')

const driver = require ('./driver')

module.exports = client => (prefix = '') => {
  const model = driver (client)

  const Currency = S.pipe ([model, prototyping (), currencing ()]) ('currencies')
  const Balance = S.pipe ([model, prototyping (), balancing ()]) ('balances')
  const Account = S.pipe ([model, prototyping ()]) ('accounts')
  const Address = S.pipe ([model, prototyping ()]) (prefix + '.' + 'addresses')

  return {
    Account,
    Balance,
    Currency,
    Address,
  }
}
