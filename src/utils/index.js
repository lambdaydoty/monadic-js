const [F, FN] = [
  require ('fluture'),
  require ('fluture-node'),
]

module.exports = {
  get,
  rand,
}

function get (url, timeout = 800) {
  return FN.retrieve (url) ({})
    .pipe (F.chain (FN.acceptStatus (200)))               // ∷ Future IM    IM
    .pipe (F.chainRej (FN.responseToError))               // ∷ Future Error IM
    .pipe (F.chain (FN.bufferResponse ('utf8')))          // ∷ Future Error String
    .pipe (F.chain (F.encase (JSON.parse)))               // ∷ Future Error Json
    .pipe (F.race (F.rejectAfter (timeout) (new Error (`*timeou(${timeout})t*`))))
}

function rand (bits = 32 * 8) {
  const crypto = require ('crypto')
  return crypto
    .randomBytes (Math.ceil (bits / 8))
    .toString ('hex')
}
