// getRpc ∷ (Provider, Promised?) → Future Error Result
module.exports = getRpc
/* biolerplate */
/* eslint func-call-spacing: ["error", "always", {"allowNewlines": true}] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
/* eslint indent: ["off"] */
/* eslint no-unexpected-multiline: ["off"] */
/* eslint operator-linebreak: ["error", "after"] */
const F$ = require ('fluture-sanctuary-types')
const F = require ('fluture')
const FN = require ('fluture-node')
const $ = require ('sanctuary-def')
const { create } = require ('sanctuary')
const opts = { checkTypes: true, env: [...$.env, ...F$.env] }
const def = $.create (opts) ('') ({})
const S = create (opts)
const imToJson = im => F.resolve (im)
  .pipe (F.chain (FN.acceptStatus (200)))       // ∷ Future IM    IM
  .pipe (F.chainRej (FN.responseToError))       // ∷ Future Error IM
  .pipe (F.chain (FN.bufferResponse ('utf8')))  // ∷ Future Error String
  .pipe (F.chain (F.encase (JSON.parse)))       // ∷ Future Error Json

const Header = { 'Content-Type': 'application/json' }
const JsonRpc2 = { 'jsonrpc': '2.0', 'id': 1 }

const { extendError } = require ('../../utils')
const RpcResponse = extendError ('RpcResponse')
const $FutureType = F$.FutureType ($.Unknown) ($.Unknown)
const $RpcResponse = $.RecordType (S.unchecked.map (x => $.EnumType ('') ('') ([x])) (JsonRpc2))
const parseJsonRpc = def
  ([$RpcResponse, $FutureType])
  (({ result, error }) => error !== undefined ? F.reject (new RpcResponse (JSON.stringify (error))) : F.resolve (result))

const bindProxyHandler = handler => new Proxy ({}, { get: handler })

function getRpc (provider = 'https://api.etherscan.io/api?module=proxy&apikey=') {
  return bindProxyHandler (function (_, moduleName) {
    return bindProxyHandler (function (__, methodName) {
      return function (params = []) {
        const method = `${moduleName}_${methodName}`
        const request = /etherscan/.test (provider) ?
          FN.retrieve (provider + '&' + qstring (method) (params)) ({}) :
          FN.sendJson ('POST') (provider) (Header) ({ ...JsonRpc2, method, params })
        const timer = F.rejectAfter (5000) (new RpcResponse ('Provider timeout: ' + provider))
        return request
          .pipe (F.chain (imToJson))
          .pipe (F.chain (parseJsonRpc))
          .pipe (F.race (timer))
      }
    })
  })
}

// ref: https://etherscan.io/apis#proxy
// ∷ String → [String] → QueryString
function qstring (method = 'eth_gasPrice') {
  return function (params = []) {
    const querystring = require ('querystring')
    const switch_ = {
      eth_getTransactionReceipt: ([txhash]) => ({ txhash }),
      eth_getBlockByNumber: tag => ([boolean]) => ({ tag, boolean }),
      eth_gasPrice: _ => ({}),
      eth_blockNumber: _ => ({}),
      eth_sendRawTransaction: ([hex]) => ({ hex }),
      eth_getTransactionByHash: ([txhash]) => ({ txhash }),
      eth_getTransactionCount: ([address, tag]) => ({ address, tag }),
    }
    const parameters = switch_[method] (params)
    return querystring.stringify ({ action: method, ...parameters })
  }
}
