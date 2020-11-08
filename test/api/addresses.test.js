const ROOT = '../../src'
const { MongoClient } = require ('mongodb')
const { MONGO_URL } = process.env
const { create } = require (`${ROOT}/app`)
const models = require (`${ROOT}/models`)
const request = require ('supertest')
const { asyncTest, rand, randN } = require ('../utils')
const F = require ('fluture')

let client = null
const CURRENCY = 'xyz'

beforeAll (async () => {
  client = await MongoClient.connect (MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  const { Currency } = models (client) ()
  await F.promise (Currency.insertOne ({ _id: CURRENCY }))
})

afterAll (async () => {
  await client.close ()
})

asyncTest ('Get an address', function * () {
  const [user, token, address] = [rand (), rand (), rand ()]
  const { Account, Address } = models (client) (CURRENCY)
  const mock = { currency: CURRENCY, account: user, address, client_id: rand () }

  yield Account.insertOne ({ _id: user, token })
  yield Address.insertOne (mock)

  const { status, body } = yield F.node (done => request (create (client))
    .get (`/api/${user}/${CURRENCY}/addresses/${address}`)
    .set ('X-Token', token)
    .end (done))

  expect (status).toBe (200)
  expect (body).toMatchObject (mock)
})

asyncTest ('Post an address', function * () {
  const [user, token, id] = [rand (), rand (), rand ()]
  const { Account } = models (client) (CURRENCY)

  yield Account.insertOne ({ _id: user, token })

  // .set ('X-Hmac', `${algo}=${signature}`)
  const { status, body } = yield F.node (done => request (create (client))
    .post (`/api/${user}/${CURRENCY}/addresses`)
    .set ('X-Token', token)
    .set ('Content-Type', 'application/json')
    .send (JSON.stringify ({
      client_id: id,
      timestamp: Date.now (),
    }))
    .end (done))

  expect (status).toBe (200)
  expect (body).toMatchObject ({ id })
})

asyncTest ('Post an address for invalid body', function * () {
  const [user, token] = [rand (), rand ()]
  const { Account } = models (client) (CURRENCY)
  const { BadParameter } = require (`${ROOT}/errors`)

  yield Account.insertOne ({ _id: user, token })

  const error = new BadParameter ()
  const now = Date.now ()
  const id = rand ()

  for (const [values, { timestamp, clientid }] of [
    [{}, {}],
    [{ timestamp: randN (1000, 0, 0) }, {}],
    [{ timestamp: +randN (100, 0, 0) }, {}],
    [{ timestamp: rand (), client_id: +randN () }, {}],
    [{ timestamp: rand (), client_id: [] }, {}],
    [{ timestamp: now, client_id: +randN () }, { timestamp: true }],
    [{ timestamp: rand (), client_id: id }, { clientid: true }],
    [{ timestamp: [], client_id: id }, { clientid: true }],
  ]) {
    // .set ('X-Hmac', `${algo}=${signature}`)
    const { status, body } = yield F.node (done => request (create (client))
      .post (`/api/${user}/${CURRENCY}/addresses`)
      .set ('X-Token', token)
      .set ('Content-Type', 'application/json')
      .send (JSON.stringify (values))
      .end (done))

    expect (status).toBe (error.status)
    expect (body.code).toBe (error.code)
    expect (body.status).toBe (error.status)
    expect (body.message).toMatch (timestamp ? /^((?!timestamp).)*$/ : /timestamp/)
    expect (body.message).toMatch (clientid ? /^((?!client_id).)*$/ : /client_id/)
  }
})
