// XXX: work in progress
/* eslint func-call-spacing: ["error", "always"] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
/* eslint no-unexpected-multiline: ["off"] */
/* eslint indent: ["off"] */
/* eslint operator-linebreak: ["error", "after"] */
/* eslint func-call-spacing: ["error", "always", {"allowNewlines": true}] */
/* boilerplate for sanctuary env */
const L = require ('partial.lenses')
const F = require ('fluture')
const F$ = require ('fluture-sanctuary-types')
const $ = require ('sanctuary-def')
const { create } = require ('sanctuary')
const env = [...$.env, ...F$.env]
const opts = { checkTypes: process.env.NODE_ENV === 'dev', env }
const S = create (opts)
const def = $.create (opts) ('') ({})
const I = x => x
const control = F.coalesce (S.Left) (S.Right)
const $FutureType = F$.FutureType ($.Unknown) ($.Unknown)
const LFuture = L.fromFantasyMonad (F.Future)
const returns = type1 => type2 => S.bimap
  (def ([$.Any, type1]) (I))
  (def ([$.Any, type2]) (I))

const extendingError = name => (class extends Error {
  constructor (message) {
    super (message)
    this.name = name
  }
})
const ReceiptUnavailable = extendingError ('ReceiptUnavailable')
const BlockPending = extendingError ('BlockPending')

const web3Utils = require ('web3-utils')
const abiDecoder = require ('abi-decoder')
const erc20abi = require ('human-standard-token-abi')
abiDecoder.addABI (erc20abi)

const nullableToMaybe = x => x === null ? S.Nothing : S.Just (x)
const nullableToFuture = error => x => x === null ? F.reject (error) : F.resolve (x)
const predicateToFuture = pred => error => x => !pred (x) ? F.reject (error) : F.resolve (x)

const $Undefinedable = $.UnaryType
  ('Undefinedable')
  ('')
  ([])
  (_ => true)
  (x => x === undefined ? [] : [x])
const $Data = bits => $.NullaryType
  (`Data(${bits})`)
  ('')
  ([$.String])
  (x => S.test (/^(0x|0X)[a-fA-F0-9]*$/) (x) && x.length === 2 + bits / 4)
const $TxHash = $Data (256)
const $Address = $Data (160)
const $Event = $.NamedRecordType
  ('web4/Event')
  ('')
  ([])
  ({
    name: $.String,
    type: $.EnumType ('') ('') (['address', 'uint256']),
    value: $.String,
  })
const $Log = $.NamedRecordType
  ('web4/Log')
  ('')
  ([])
  ({
    name: $.String,
    events: $.Array ($Event),
    address: $Address,
  })
const $Receipt = $.NamedRecordType
  ('web4/Receipt')
  ('')
  ([])
  ({
    status: $.Boolean,
    gasUsed: $.NonNegativeInteger,
    logs: $.Array ($Log),
  })
const $Transaction = $.NamedRecordType
  ('web4/Transaction')
  ('')
  ([])
  ({
    hash: $TxHash,
    to: $.Maybe ($Address), // Nothing for `contract creation`
    value: $.String, // TODO
    timestamp: $.NonNegativeInteger,
    receipt: $Receipt,
  })
const $Block = $.Array ($Transaction)

const S_ = create ({ ...opts, env: [...env, $Undefinedable ($Log)] })

module.exports = function ({ rpc, etherscan }) {
  const isLogged = log => log !== undefined
  const isMined = ({ number: q }) => q !== null

  // ∷ TxHash → Future Error Receipt
  const getTransactionReceipt = def
    ([$TxHash, $FutureType])
    (txhash => rpc.eth.getTransactionReceipt (txhash)
      .pipe (F.chain (nullableToFuture (new ReceiptUnavailable (txhash))))
      .pipe (F.map (({ status, gasUsed, logs }) =>
        ({
          status: !!web3Utils.hexToNumber (status),
          gasUsed: web3Utils.hexToNumber (gasUsed),
          logs: S_.filter (isLogged) (abiDecoder.decodeLogs (logs)),
        })))
      .pipe (returns ($.Error) ($Receipt)))

  // ∷ NonNegativeInteger → Future Error Block
  const getBlockByNumber = def
    ([$.NonNegativeInteger, $FutureType])
    (N => rpc.eth.getBlockByNumber (web3Utils.toHex (N), true)
      .pipe (F.chain (predicateToFuture (isMined) (new BlockPending (`${N}`))))
      .pipe (F.map (({ timestamp, transactions }) => transactions
        .map (({ hash, to, value }) =>
          ({
            internal: false,
            hash,
            to: nullableToMaybe (to),
            value: web3Utils.fromWei (web3Utils.hexToNumberString (value)),
            timestamp: web3Utils.hexToNumber (timestamp) * 1000,
            receipt: getTransactionReceipt (hash), // ∷ Future Error Receipt
          }))))
      .pipe (F.chain (L.traverse (LFuture) (I) ([L.elems, 'receipt'])))
      .pipe (returns ($.Error) ($Block)))

  // ∷ NonNegativeInteger → Future Error Block
  const getInternalsByNumber = def
    ([$.NonNegativeInteger, $FutureType])
    (N => etherscan.etherscan ({
      module: 'account',
      action: 'txlistinternal',
      startblock: `${N}`,
      endblock: `${N}`,
      sort: 'asc' })
      .pipe (F.map (S.filter (({ value, isError, errCode, type }) =>
        (
          value !== '0' &&
          isError === '0' &&
          errCode === '' &&
          type === 'call'
        ))))
      .pipe (F.map (S.map (({ hash, to, value, timeStamp, gasUsed }) =>
        ({
          internal: true,
          hash,
          to: nullableToMaybe (to),
          value: web3Utils.fromWei (value),
          timestamp: +timeStamp * 1000,
          receipt: {
            status: true,
            gasUsed: +gasUsed,
            logs: [],
          },
        }))))
      .pipe (returns ($.Error) ($Block)))

  // ∷ NonNegativeInteger → Future Error (Either Block Block)
  // a Right Block stands for traced transactions
  // a Left Block stands for untraced transactions
  const getTransactions = def
    ([$.NonNegativeInteger, $FutureType])
    (N => F.go (function * () {
      const txs = yield getBlockByNumber (N)
      return S.bimap
        (S.K (txs))
        (S.concat (txs))
        (yield control (getInternalsByNumber (N)))
      })
      .pipe (returns ($.Error) ($.Either ($Block) ($Block))))

  return {
    // getTransactionReceipt,
    // getBlockByNumber,
    // getInternalsByNumber,
    getTransactions,
    ...{ $Transaction, $Block, $Receipt, $TxHash, $Address, $Log, $Event },
  }
}

// const Contract = require ('web3-eth-contract')
// const Provider = require ('./provider')
// const BN = require ('bignumber.js')
// const { bn } = require ('../../utils')

// const {
//   ETH_PARITY_PROVIDER,
//   ETH_PROVIDER,
// } = process.env

// const GAS = 21000 // transaction gas for eth is a constant
// const web3Provider = new Provider (ETH_PROVIDER)

// // ∷ Promise Error WeiString
// function getGasPrice (multiplier = '1.2') {
//   const rpc = getRpc (ETH_PROVIDER)
//   const parse = q => bn (q /* ∷ Quantity in Wei */)
//     .times (multiplier)
//     .integerValue ()
//     .toFixed ()
//   return rpc.eth.gasPrice () // ∷ Future Error Quantity
//     .pipe (F.map (parse))
//     .pipe (F.promise)
// }

// // ∷ Number → Currency → String → Promise Error BN
// function getBalance (confirmation = 25 /* blockQT = 'latest' */) {
//   return function ({ _id: currency, info = {} }) {
//     return async function (address) {
//       const rpc = getRpc (ETH_PROVIDER, true)
//       const blockN = '0x' + new BN (await rpc.eth.blockNumber ())
//         .minus (confirmation)
//         .toString (16)

//       if (currency === 'eth') {
//         return new BN (await rpc.eth.getBalance (address, blockN))
//           .shiftedBy (-18)
//       } else {
//         const { address: to, decimals } = info
//         const data = new Contract (erc20abi, to)
//           .methods
//           .balanceOf (address)
//           .encodeABI ()
//         return new BN (await rpc.eth.call ({ to, data }, blockN))
//           .shiftedBy (-decimals)
//       }
//     }
//   }
// }

// function getBalanceIncrement (blockNumber) {
//   return async function (address) {
//     const rpc = getRpc (ETH_PROVIDER, true)
//     const current = '0x' + bn (blockNumber).toString (16)
//     const previous = '0x' + bn (blockNumber - 1).toString (16)
//     const [balance1, balance0] = [
//       await rpc.eth.getBalance (address, current),
//       await rpc.eth.getBalance (address, previous),
//     ]
//     return bn (balance1)
//       .minus (balance0)
//       .shiftedBy (-18)
//   }
// }

// function getEthGas () {
//   return GAS
// }

// async function getBlockNumber (confirmation = 0) {
//   return (await web3 ()).eth.getBlockNumber ().then (n => n - confirmation + 1)
// }

// async function sendSignedTransaction (hex) {
//   const [tag, log] = ['@web3.sendTrx', require ('../../log')]
//   const [info, error] = [log.info (tag), log.error (tag)]

//   const client = await web3 ()

//   return new Promise ((resolve, reject) => {
//     // https://web3js.readthedocs.io/en/v1.3.0/callbacks-promises-events.html#promievent
//     const timeout = 10000
//     const timer = setTimeout (reject, timeout)
//     client
//       .eth
//       .sendSignedTransaction (hex)
//       .once ('transactionHash', (h) => !clearTimeout (timer) && resolve (h))
//       .on ('error', (e) => info (`error=${e.message}`))
//       .then (({ status }) => (status ? info : error) (`receipt (status=${status})`))
//       .catch (catchOkErrors)
//   })
//   function catchOkErrors (e) {
//     const { message } = e
//     if (/known transaction/.test (message)) return null
//     if (/Transaction with the same hash was already imported/.test (message)) return null
//     if (/Transaction was not mined within 120 seconds/.test (message)) return null
//     error (e)
//     throw e
//   }
// }

// /**
//  * > decoded[0]
//  * { name: 'Transfer',
//  *   events:
//  *    [ { name: '_from',
//  *        type: 'address',
//  *        value: '0x74c530cf712407f32e218b4d4e72f58597896a95' },
//  *      { name: '_to',
//  *        type: 'address',
//  *        value: '0xa6eb333b0f96c105edbf690c07fb738d750d28f7' },
//  *      { name: '_value', type: 'uint256', value: '1000' } ],
//  *   address: '0xBb2CeA206347D168Dc3E93eb34bd79b185D4ECa3' }
//  */

// async function newContract (address, options) {
//   const client = await web3 ()
//   return new client.eth.Contract (erc20abi, address, options)
// }

// module.exports = {
//   web3,
//   Web3: require ('web3'),
//   getBlockNumber,
//   getBlock,
//   getGasPrice,
//   getEthGas,
//   getReceipt,
//   sendSignedTransaction,
//   decodeLogs,
//   traceTransaction,
//   newContract,
//   getBalance,
//   getBalanceIncrement,
// }
