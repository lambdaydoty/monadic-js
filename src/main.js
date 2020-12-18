process.env.NODE_ENV = 'dev'

const F = require ('fluture')
const etherscan = require ('./services/eth/etherscan') ({ network: '3', apikey: 'DT7UUQ9WH4M2C74TCA716563FMNV54CPYJ' })
const rpc = require ('./services/eth/getRpc') ('http://localhost:8546')
const web4 = require ('./services/eth/web4') ({ rpc, etherscan })

// const fut = web4.getTransactions (9278702)
// const fut = web4.getGasPrice (1.51)
const fut = web4.getBlockNumber (0)

F.fork
  (console.error)
  (console.log)
  (fut)
