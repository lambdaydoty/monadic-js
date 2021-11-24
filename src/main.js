process.env.NODE_ENV = 'dev'

const S = require ('sanctuary').unchecked
const F = require ('fluture')
const etherscan = require ('./services/eth/getEtherscan') ({ network: '3', apikey: 'DT7UUQ9WH4M2C74TCA716563FMNV54CPYJ' })
const rpc = require ('./services/eth/getRpc') ('http://localhost:8546')
const web4 = require ('./services/eth/web4') ({ rpc, etherscan })

const currencies = [
  {
    address: '0xbb2cea206347d168dc3e93eb34bd79b185d4eca3',
    symbol: 'bgc21-erc20',
    decimals: 5,
  },
]

const fut = web4.getTransactions (currencies) (9282951)
// const fut = web4.getGasPrice (1.51)
// const fut = web4.getBlockNumber (0)
// const fut = web4.getBalance (web4.zeroAddress) (9285949) ('0x8119E24B4C70c0ca8c0B9851F811bB26F6Fe63B1')
// const fut = web4.getBalance
//   ({ symbol: 'bgc21', decimals: 5, address: '0xbb2cea206347d168dc3e93eb34bd79b185d4eca3' })
//   (9286320)
//   ('0x8119E24B4C70c0ca8c0B9851F811bB26F6Fe63B1')
// const fut = web4.getBalance
//   (web4.eth)
//   (9289145)
//   ('0x8119E24B4C70c0ca8c0B9851F811bB26F6Fe63B1')

F.fork
  (console.error)
  (S.either (x => console.log ('*Left*', x)) (console.log))
  (fut)

// const L = require ('partial.lenses')
// const BN = require ('bignumber.js')

//   // ([
//   //   // S.filter (elog => S.isJust (S.find (eq (elog)) (currencies))),
//   //   S.filter (elog => S.elem (elog) (currencies)),
//   // ])

// const currencies = [
//   { address: 'contract-address-A', symbol: 'btc', decimals: 8 },
//   { address: 'contract-address-B', symbol: 'eth', decimals: 4 },
// ]

// const tx = {
//   type: 'normal',
//   hash: '123213',
//   to: S.Just ('0x131312414'),
//   value: new BN (123),
//   timestamp: +Date.now (),
//   receipt: {
//     status: true,
//     gasUsed: 12344556,
//     logs: [
//       {
//         address: 'contract-address-A',
//         name: 'Transfer',
//         events: [
//           { name: '_from', type: 'address', value: '0xabc' },
//           { name: '_to', type: 'address', value: '0xpqr' },
//           { name: '_value', type: 'uint256', value: '101002303030' },
//         ], // arg list
//       },
//       {
//         address: 'contract-address-B',
//         name: 'Transfer',
//         events: [
//           { name: '_from', type: 'address', value: '0xabc' },
//           { name: '_to', type: 'address', value: '0xpqr' },
//           { name: '_value', type: 'uint256', value: '987654321' },
//         ], // arg list
//       },
//     ],
//   }
// }

// // console.log (
// //   parseSubTx (currencies) (tx.receipt.logs),
// // )

// // ∷ [Currency] → [EventLog] → [SubTransaction]
// const parseSubTx = currencies => logs => {
//   // ∷ Currency → EventLog → Maybe SubTransaction
//   const match = ({ address: contract, decimals, symbol }) => S.pipe
//     ([
//       S.of (S.Maybe),
//       S.filter (({ address: sendto }) => sendto === contract),
//       S.filter (({ name: eventName }) => eventName === 'Transfer'),
//       S.map (({ events: eventParameters }) => eventParameters
//         .map (({ name, type, value }) => S.Pair
//           (name.replace ('_', ''))
//           (
//             type === 'address' ? S.Just (value) :
//             type === 'uint256' ? new BN (value).shiftedBy (-decimals) :
//             /* otherwise */ null
//           ))),
//       S.map (S.fromPairs),
//       S.map (S.insert ('type') ('token')),
//       S.map (S.insert ('symbol') (symbol)),
//     ])
//   return S.justs (S.lift2 (match) (currencies) (logs))
// }

// const JsArray = {
//   of: x => [x],
//   map: (f, xs) => xs.map (x => f (x)),
// }

// const subTx = ['receipt', 'logs']

// // ∷ Transaction → [Transaction]
// const produce = S.pipe ([
//   L.traverse (JsArray) (parseSubTx (currencies)) (subTx),
//   S.map (o => ({ ...o, ...L.get (subTx) (o) })),
// ])

// // ∷ Transaction → [Transaction]
// const expand = S.ap (S.append) (produce)

// console.log (JSON.stringify (
//   expand (tx),
//   null,
//   2,
// ))
