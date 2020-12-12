const F = require ('fluture')
const $ = require ('sanctuary-def')

const BN = require ('bignumber.js')
const bn = (...args) => new BN (...args)
const GWEI = 9

const { get } = require ('../../utils')

const { ETHERSCAN_GAS_ORACLE } = process.env

const def = $.create ({ checkTypes: true, env: $.env }) ('') ({})

// ref: https://etherscan.io/apis#gastracker
const $Response = $.RecordType ({
  'result': $.RecordType ({
    'ProposeGasPrice': $.NonEmpty ($.String), // TODO: $DecimalString
    'FastGasPrice': $.NonEmpty ($.String), // TODO: $DeciamlString
  }),
})

// ∷ $Response → WeiString
const fromResponse = ({
  'result': {
    'FastGasPrice': x,
  },
}) => bn (x).shiftedBy (GWEI)

module.exports = _ => F.go (function * () {
  return {
    gas_price: yield get (ETHERSCAN_GAS_ORACLE)
      .pipe (F.map (def ([$.Object, $Response]) (x => x)))  // ∷ Future Error Json*
      .pipe (F.map (fromResponse)),                         // ∷ Future Error ***
  }
})
