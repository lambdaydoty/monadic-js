/* REF: https://info.etherscan.com/api-return-errors/ */
module.exports = bindEnv
/* biolerplate */
/* eslint func-call-spacing: ["error", "always", {"allowNewlines": true}] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
/* eslint indent: ["off"] */
/* eslint no-unexpected-multiline: ["off"] */
const F$ = require ('fluture-sanctuary-types')
const F = require ('fluture')
const FN = require ('fluture-node')
const $ = require ('sanctuary-def')
const { unchecked: S } = require ('sanctuary')
const env = [...$.env, ...F$.env]
const def = $.create ({ checkTypes: true, env }) ('') ({})
const imToJson = im => F.resolve (im)
  .pipe (F.chain (FN.acceptStatus (200)))       // ∷ Future IM    IM
  .pipe (F.chainRej (FN.responseToError))       // ∷ Future Error IM
  .pipe (F.chain (FN.bufferResponse ('utf8')))  // ∷ Future Error String
  .pipe (F.chain (F.encase (JSON.parse)))       // ∷ Future Error Json

const $Response = $.RecordType ({
  status: $.EnumType ('') ('') (['1', '0']),
  message: $.String,
  result: $.Any,
})

const parseResponse = def
  ([$Response, F$.FutureType ($.Error) ($.Any)])
  (({ result }) => S.is ($.Array ($.Object)) (result) ?
    F.resolve (result) :
    F.reject (new Error (result)))

const querystring = require ('querystring')

function bindEnv ({ network, apikey }) {
  return { etherscan, getInternalsByBlock }

  function etherscan (parameters) {
    const net = network === '3' ? '-ropsten' : ''
    const query = querystring.stringify ({ apikey, ...parameters })
    const url = `https://api${net}.etherscan.io/api?${query}`
    const timer = F.rejectAfter (5000) (new Error ('Provider timeout: ' + url))
    return FN.retrieve (url) ({})
      .pipe (F.chain (imToJson))
      .pipe (F.chain (parseResponse))
      .pipe (F.race (timer))
  }

  // ∷ Integer → [Tx]
  function getInternalsByBlock (block) {
    return etherscan ({
      module: 'account',
      action: 'txlistinternal',
      startblock: block,
      endblock: block,
      sort: 'asc',
    })
  }
}
