const { fromPairs } = require('ramda')
const statuses = require('statuses')

module.exports = fromPairs(
  Object.entries(statuses.STATUS_CODES)
    .filter(([status]) => status >= 400)
    .map(([status, message]) => {
      const name = message.replace(/[ ']/g, '')
      return [
        name,
        class extends Error {
          constructor (...args) {
            super(...args)
            this.name = name
            this.status = parseInt(status)
            this.message = this.message || message
          }
        },
      ]
    })
)
