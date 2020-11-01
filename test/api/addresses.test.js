const { MongoClient } = require ('mongodb')
const { MONGO_URL } = process.env
const models = require ('../../src/models')
const request = require ('supertest')
const { create } = require ('../../src/app')
const { rand } = require ('../../src/utils')

let client = null

beforeAll (async () => {
  client = await MongoClient.connect (MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
})

afterAll (async () => {
  await client.close ()
})

const F = require ('fluture')

const asyncTest = (name, routine) => test (name, () => F.promise (F.go (routine)))
// const control = F.coalesce (S.Left) (S.Right)

asyncTest ('Get an address', function * () {
  const [currency, user, token, address] = [rand (), rand (), rand (), rand ()]
  const { Account, Address, Currency } = models (client) (currency)
  const mock = { currency, account: user, address, client_id: null }

  yield Currency.insertOne ({ _id: currency })
  yield Account.insertOne ({ _id: user, token })
  yield Address.insertOne (mock)

  const { status, body } = yield F.node (done => request (create (client))
    .get (`/api/${user}/${currency}/addresses/bar`)
    .set ('token', token)
    .end (done))

  expect (status).toBe (200)
  expect (body).toMatchObject (mock)
})
