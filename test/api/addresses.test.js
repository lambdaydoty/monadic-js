const { MongoClient } = require ('mongodb')
const { MONGO_URL } = process.env
const models = require ('../../src/models')
const request = require ('supertest')
const { create } = require ('../../src/app')

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

it ('should insert a doc', async () => {
  const currency = 'xyz'
  const user = 'test'
  const token = 'qwer1234'
  const { Account, Address, Currency } = models (client) (currency)
  const mock = { currency, account: user, address: 'bar', client_id: null }

  await Currency
    .insertOne ({ _id: currency })
    .pipe (F.promise)
  await Account
    .insertOne ({ _id: user, token })
    .pipe (F.promise)
  await Address
    .insertOne (mock)
    .pipe (F.promise)

  const { status, body } = await request (create (client))
    .get (`/api/${user}/${currency}/addresses/bar`)
    .set ('token', token)

  expect (status).toBe (200)
  expect (body).toMatchObject (mock)
})
