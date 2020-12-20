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
const $FutureType = F$.FutureType ($.Unknown) ($.Unknown)
const LFuture = L.fromFantasyMonad (F.Future)
const control = F.coalesce (S.Left) (S.Right)
const returns = type1 => type2 => S.bimap
  (def ([$.Any, type1]) (I))
  (def ([$.Any, type2]) (I))

const { extendError } = require ('../../utils')
const ReceiptUnavailable = extendError ('ReceiptUnavailable')
const BlockPending = extendError ('BlockPending')

const { eth } = require ('./const')
const BN = require ('bignumber.js')
const U = require ('web3-utils')
const Contract = require ('web3-eth-contract')
const abiDecoder = require ('abi-decoder')
const erc20abi = require ('human-standard-token-abi')
abiDecoder.addABI (erc20abi)
BN.prototype['@@show'] = BN.prototype[require ('util').inspect.custom] = function () {
  return `BN ("${this.toFixed ()}")`
}

const nullableToMaybe = x => x === null ? S.Nothing : S.Just (x)
const nullableToFuture = error => x => x === null ? F.reject (error) : F.resolve (x)
const predicateToFuture = pred => error => x => !pred (x) ? F.reject (error) : F.resolve (x)

const $BN = $.NullaryType
  ('BigNumber')
  ('')
  ([$.Object])
  (x => BN.isBigNumber (x))
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
const $SolitidyType = $.EnumType
  ('SolidityType')
  ('https://docs.soliditylang.org/en/develop/types.html')
  (['address', 'uint256'])
const $EventParamValue = $.NullaryType
  ('web4/EventParamValue')
  ('')
  ([])
  (x => S.is ($BN) (x) || S.is ($.Maybe ($Address)))
const $EventParam = $.NamedRecordType
  ('web4/EventParam')
  ('')
  ([])
  ({
    name: $.String,           // e.g. `_from`   | `_to`     | `_value`
    type: $SolitidyType,      // e.g. `address` | `address` | `uint256`
    value: $.String, // Mixed // e.g. `0x9f6..` | `0x811..` | `10000000`
  })                 // event Transfer(address indexed _from, address indexed _to, uint256 _value)
const $EventLog = $.NamedRecordType
  ('web4/Log')
  ('')
  ([])
  ({
    name: $.String,                // e.g. `Transfer`
    events: $.Array ($EventParam), // e.g. [...]
    address: $Address,             // e.g. `0xbb2cea206347d168dc3e93eb34bd79b185d4eca3` (contract address)
  })
const $Receipt = $.NamedRecordType
  ('web4/Receipt')
  ('')
  ([])
  ({
    status: $.Boolean,
    gasUsed: $.NonNegativeInteger,
    logs: $.Array ($EventLog),
  })
const $Transaction = $.NamedRecordType
  ('web4/Transaction')
  ('')
  ([])
  ({
    type: $.EnumType ('') ('') (['normal', 'internal', 'erc20']),
    currency: $.NonEmpty ($.String),
    hash: $TxHash,
    to: $.Maybe ($Address), // `Nothing` for `contract creation`
    value: $BN,
    timestamp: $.NonNegativeInteger,
    receipt: $Receipt,
  })
const $Block = $.Array ($Transaction)
const $Currency = $.NamedRecordType
  ('web4/Currency')
  ('')
  ([])
  ({
    address: $Address,
    symbol: $.NonEmpty ($.String),
    decimals: $.NonNegativeInteger,
  })

const types = { $Transaction, $Block, $Receipt, $TxHash, $Address, $EventLog, $EventParam, $Currency }

const JsArray = {
  of: x => [x],
  map: (f, xs) => xs.map (x => f (x)),
}

module.exports = function ({ rpc, etherscan }) {
  const isLogged = log => log !== undefined
  const isMined = ({ number: q }) => q !== null
  const S_ = create ({ ...opts, env: [...env, $Undefinedable ($EventLog), $EventParamValue] })

  // ∷ [Currency] → [EventLog] → [SubTransaction]
  const parseSubTx = currencies => logs => {
    // ∷ Currency → EventLog → Maybe SubTransaction
    const match = ({ address: contract, decimals, symbol }) => S.pipe
      ([
        S.of (S.Maybe),
        S.filter (({ address: sendto }) => sendto === contract),
        S.filter (({ name: eventName }) => eventName === 'Transfer'),
        S_.map (({ events: eventParameters }) => eventParameters
          .map (({ name, type, value }) => S.Pair
            (name.replace ('_', ''))
            (
              type === 'address' ? S.Just (value) :
              type === 'uint256' ? new BN (value).shiftedBy (-decimals) : null
            ))),
        S_.map (S_.fromPairs),
        S.map (S.unchecked.concat ({ type: 'erc20', currency: symbol })),
      ])
    return S.justs (S.lift2 (match) (currencies) (logs))
  }
  // ∷ SubTransaction → Transaction
  const subTxToTx = ({ hash, timestamp, receipt: { logs: { to, type, value, currency }, ...etc } }) =>
    ({ type, currency, hash, to, value, timestamp, receipt: { ...etc, logs: [] } })

  // ∷ TxHash → Future Error Receipt
  const getTransactionReceipt = def
    ([$TxHash, $FutureType])
    (txhash => rpc.eth.getTransactionReceipt ([txhash])
      .pipe (F.chain (nullableToFuture (new ReceiptUnavailable (txhash))))
      .pipe (F.map (({ status, gasUsed, logs }) =>
        ({
          status: !!U.hexToNumber (status),
          gasUsed: U.hexToNumber (gasUsed),
          logs: S_.filter (isLogged) (abiDecoder.decodeLogs (logs)),
        })))
      .pipe (returns ($.Error) ($Receipt)))

  const lenseEveryReceipt = [L.elems, 'receipt']
  const lenseSubTx = ['receipt', 'logs']

  // ∷ [Currency] → NonNegativeInteger → Future Error Block
  const getBlockByNumber = def
    ([$.Array ($Currency), $.NonNegativeInteger, $FutureType])
    (currencies => n => rpc.eth.getBlockByNumber ([U.toHex (n), true])
      .pipe (F.chain (predicateToFuture (isMined) (new BlockPending ('' + n))))
      .pipe (F.map (({ timestamp, transactions }) => transactions
        .map (({ hash, to, value }) =>
          ({
            type: 'normal',
            currency: 'eth',
            hash,
            to: nullableToMaybe (to),
            value: new BN (U.fromWei (U.hexToNumberString (value))),
            timestamp: U.hexToNumber (timestamp) * 1000,
            receipt: hash, // prepare for traverse
          }))))
      .pipe (F.chain (L.traverse (LFuture) (h => getTransactionReceipt (h)) (lenseEveryReceipt)))
      .pipe (F.map (S.chain (S.ap (S.append) (S.pipe
        ([
          L.traverse (JsArray) (parseSubTx (currencies)) (lenseSubTx),
          S.map (subTxToTx),
        ])))))
      .pipe (returns ($.Error) ($Block)))

  // ∷ NonNegativeInteger → Future Error Block
  const getInternalsByNumber = def
    ([$.NonNegativeInteger, $FutureType])
    (n => etherscan.etherscan ({
      module: 'account',
      action: 'txlistinternal',
      startblock: '' + n,
      endblock: '' + n,
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
          type: 'internal',
          currency: 'eth',
          hash,
          to: nullableToMaybe (to),
          value: new BN (U.fromWei (value)),
          timestamp: +timeStamp * 1000,
          receipt: {
            status: true,
            gasUsed: +gasUsed,
            logs: [],
          },
        }))))
      .pipe (returns ($.Error) ($Block)))

  // ∷ [$Currency] → NonNegativeInteger → Future Error (Either Block Block)
  // a Right Block stands for traced transactions
  // a Left Block stands for untraced transactions
  const getTransactions = def
    ([$.Array ($Currency), $.NonNegativeInteger, $FutureType])
    (currencies => n => F.go (function * () {
      const txs = yield getBlockByNumber (currencies) (n)
      return S.bimap
        (S.K (txs))
        (S.concat (txs))
        (yield control (getInternalsByNumber (n)))
      })
      .pipe (returns ($.Error) ($.Either ($Block) ($Block))))

  // ∷ Number → Future Error BN
  const getGasPrice = def
    ([$.PositiveFiniteNumber, $FutureType])
    (multiplier => rpc.eth.gasPrice ()
      .pipe (F.map (q => new BN (U.hexToNumberString (q))))
      .pipe (F.map (x => x
        .times (multiplier)
        .integerValue (BN.ROUND_CEIL)
        .shiftedBy (-eth.decimals)))
      .pipe (returns ($.Error) ($BN)))

  // ∷ NonNegativeInteger → Future Error NonNegativeInteger
  const getBlockNumber = def
    ([$.NonNegativeInteger, $FutureType])
    (confirmation => rpc.eth.blockNumber ()
      .pipe (F.map (q => +U.hexToNumberString (q)))
      .pipe (F.map (S.sub (confirmation)))
      .pipe (returns ($.Error) ($.NonNegativeInteger)))

  // ∷ Address → NonNegativeInteger → Address → Future Error BN
  const getBalance = def
    ([$Currency, $.NonNegativeInteger, $Address, $FutureType])
    (currency => n => address => ((currency.address === eth.address) ?
      rpc.eth.getBalance ([address, U.toHex (n)]) :
      rpc.eth.call ([
        {
          to: currency.address,
          data: new Contract (erc20abi, currency.address)
            .methods
            .balanceOf (address)
            .encodeABI (),
        },
        U.toHex (n) ]))
      .pipe (F.map (q => new BN (U.hexToNumberString (q))))
      .pipe (F.map (x => x.shiftedBy (-currency.decimals)))
      .pipe (returns ($.Error) ($BN)))

  return {
    // getTransactionReceipt,
    // getBlockByNumber,
    // getInternalsByNumber,
    getTransactions,
    getGasPrice,
    getBlockNumber,
    getBalance,
    ...types,
    eth,
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
