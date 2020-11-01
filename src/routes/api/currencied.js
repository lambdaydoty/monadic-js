const express = require ('express')

const names = [
  'addresses',
  // 'withdrawals',
  // 'sweeps',
  // 'deposits',
  // 'payouts',
  // 'payins',
  // 'approvements',
  // 'stats',
]

module.exports = names.reduce (
  (route, name) => route.use (`/${name}`, require (`./${name}`)),
  express.Router (),
)
