const { fromPairs } = require ('ramda')
const http = require ('./http')

function create (name, parent, code) {
  return [
    name,
    class extends http[parent] {
      constructor (...args) {
        super (...args)
        this.name = name
        this.code = `E${this.status}${code}`
      }
    },
  ]
}

module.exports = fromPairs ([
  // 400
  create ('BadSignatureHeader', 'BadRequest', '00'),
  create ('BadSignatureAlgorithm', 'BadRequest', '01'),
  create ('BadSignature', 'BadRequest', '02'),
  create ('BadBody', 'BadRequest', '03'),
  create ('BadTimestamp', 'BadRequest', '04'),
  create ('BadBalance', 'BadRequest', '10'),
  create ('BadUtxoBalance', 'BadRequest', '11'),
  create ('ValidationFailed', 'BadRequest', '20'),

  // 401
  create ('Unauthenticated', 'Unauthorized', '00'),
  create ('BadTokenHeader', 'Unauthorized', '01'),

  // 402
  create ('PaymentRequired', 'PaymentRequired', '00'),

  // 403
  create ('PermissionDenied', 'Forbidden', '00'),
  create ('BadAccount', 'Forbidden', '01'),

  // 404
  create ('NotFound', 'NotFound', '00'),
  create ('NotFoundAccount', 'NotFound', '01'),
  create ('NotFoundCurrency', 'NotFound', '02'),
  create ('NotFoundAddress', 'NotFound', '03'),
  create ('NotFoundDeposit', 'NotFound', '04'),
  create ('NotFoundWithdrawal', 'NotFound', '05'),
  create ('NotFoundPayout', 'NotFound', '06'),
  create ('NotFoundPayin', 'NotFound', '07'),
  create ('NotFoundApprovement', 'NotFound', '08'),
  create ('NotFoundSweep', 'NotFound', '09'),
  create ('NotFoundBalance', 'NotFound', '10'),
  create ('NotFoundPool', 'NotFound', '11'),

  // 409
  create ('Conflict', 'Conflict', '00'),

  // 417
  create ('BadBalanceHeader', 'ExpectationFailed', '00'),

  // 422
  create ('BadParameter', 'UnprocessableEntity', '00'),
  create ('BadAddress', 'UnprocessableEntity', '01'),
  create ('NotApprovedAddress', 'UnprocessableEntity', '02'),
  create ('BadCurrency', 'UnprocessableEntity', '02'),

  // 423
  create ('Racing', 'Locked', '00'),
  // create ('RacingAccount', 'Locked', '01'),
  // create ('RacingCurrency', 'Locked', '02'),
  create ('RacingAddress', 'Locked', '03'),
  create ('RacingDeposit', 'Locked', '04'),
  create ('RacingWithdrawal', 'Locked', '05'),
  create ('RacingPayout', 'Locked', '06'),
  // create ('RacingPayin', 'Locked', '07'),
  // create ('RacingApprovement', 'Locked', '08'),
  create ('RacingSweep', 'Locked', '09'),

  // 501
  create ('NotImplementedCurrency', 'NotImplemented', '01'),
  create ('NotImplementedNonFullPayment', 'NotImplemented', '02'),
  create ('NotImplementedStats', 'NotImplemented', '03'),

  // 503
  create ('ProviderTimeout', 'ServiceUnavailable', '01'),
  create ('ProviderExhausted', 'ServiceUnavailable', '02'),
  create ('ResponseInconsistent', 'ServiceUnavailable', '03'),
])
