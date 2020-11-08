const [F, { unchecked: S }] = [
  require ('fluture'),
  require ('sanctuary'),
]
const crypto = require ('crypto')

module.exports = {
  asyncTest (name, routine) {
    return test (name, () => F.promise (F.go (routine)))
  },

  control (fut) {
    return F.coalesce (S.Left) (S.Right) (fut)
  },

  rand (bits = 32 * 8) {
    return crypto
      .randomBytes (Math.ceil (bits / 8))
      .toString ('hex')
  },

  randN (max = 1, min = 0.00000001, digit = 8) {
    const tailingZero = /\d+\.\d*0$/
    let x = null
    do {
      x = (Math.random () * (max - min) + min).toFixed (digit)
    } while (tailingZero.test (x))
    return x
  },
}
