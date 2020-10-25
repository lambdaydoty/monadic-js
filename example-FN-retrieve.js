/* eslint func-call-spacing: ["error", "always"] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
const [F, FN] = [require ('fluture'), require ('fluture-node')]
const [$] = [require ('sanctuary-def')]

const BN = require ('bignumber.js')
const bn = (...args) => new BN (...args)
const GWEI = 9

Object.assign (process.env, {
  ETHERSCAN_GAS_ORACLE: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=...',
})
const { ETHERSCAN_GAS_ORACLE } = process.env

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

/**
 *
 * Http Json Request Pattern:
 * 1, 2) Chosse accept status code
 * 3) IncomingMessage (Buffer) to String (encoding)
 * 4) Parse Json string to Object
 * 5) Parse Json object to a specific `type`
 * 6) Destruct, map, & filter the response
 * 7) Guard timeout with a rejection timer
 *
 * */
const $def = $.create ({ checkTypes: true, env: $.env }) ('') ({})

const etherscan = url => FN.retrieve (url) ({})
  .pipe (F.chain (FN.acceptStatus (200)))               // ∷ Future IM    IM
  .pipe (F.chainRej (FN.responseToError))               // ∷ Future Error IM
  .pipe (F.chain (FN.bufferResponse ('utf8')))          // ∷ Future Error String
  .pipe (F.chain (F.encase (JSON.parse)))               // ∷ Future Error Json
  .pipe (F.map ($def ([$.Object, $Response]) (x => x))) // ∷ Future Error Json*
  .pipe (F.map (fromResponse))                          // ∷ Future Error ***
  .pipe (F.race (F.rejectAfter (800) (new Error ('*timeout*'))))

const app = etherscan (ETHERSCAN_GAS_ORACLE)

console.log ('*start*')

F.fork (console.error) (console.log) (app)
