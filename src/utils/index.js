const { unchecked: S } = require ('sanctuary')
const F = require ('fluture')
const FN = require ('fluture-node')
const crypto = require ('crypto')

module.exports = {
  Do, // ∷ TypeRepresentation → Generator → Monad
  get,
  post,
  sendForm,
  rand,
  hmac,
  extendError,
}

function extendError (name) {
  return (class extends Error {
    constructor (message) {
      super (message)
      this.name = name
    }
  })
}

function error (timeout) {
  return new Error (`*timeout(${timeout})*`)
}

function incomingMessageToJson (im) {
  return S.of (F.Future) (im)
    .pipe (F.chain (FN.acceptStatus (200)))               // ∷ Future IM    IM
    .pipe (F.chainRej (FN.responseToError))               // ∷ Future Error IM
    .pipe (F.chain (FN.bufferResponse ('utf8')))          // ∷ Future Error String
    .pipe (F.chain (F.encase (JSON.parse)))               // ∷ Future Error Json
}

// TODO: currying
function get (url, header = {}, timeout = 800) {
  return FN.retrieve (url) (header)
    .pipe (F.chain (incomingMessageToJson))                     // ∷ Future Error Json
    .pipe (F.race (F.rejectAfter (timeout) (error (timeout))))  // ∷ Future Error Json
}

// TODO: currying & `content-type`
function post (url, header, json = {}, timeout = 1000) {
  return FN.sendJson ('POST') (url) (header) (json)
    .pipe (F.chain (incomingMessageToJson))                     // ∷ Future Error Json
    .pipe (F.race (F.rejectAfter (timeout) (error (timeout))))  // ∷ Future Error Json
}

function sendForm (url, header, form = {}, timeout = 1000) {
  return FN.sendForm ('POST') (url) (header) (form)
    .pipe (F.chain (incomingMessageToJson))                     // ∷ Future Error Json
    .pipe (F.race (F.rejectAfter (timeout) (error (timeout))))  // ∷ Future Error Json
}

function rand (bits = 32 * 8) {
  return crypto
    .randomBytes (Math.ceil (bits / 8))
    .toString ('hex')
}

function hmac (algo = 'sha512') {
  return function (key = '') {
    return function (str = '') {
      return crypto
        .createHmac (algo, key)
        .update (str, 'utf8')
        .digest ('hex')
    }
  }
}

// TODO: trampoline
function Do (type) {
  return function (generator) {
    const gen = generator ()
    return (function next (err, v) {
      if (err) console.error (err)
      const { done, value } = gen.next (v)
      return (
        done ? S.of (type) (value) :
        /* otherwise */ S.chain (x => next (null, x) || S.of (type) (x)) (value)
      )
    }) ()
  }
}
