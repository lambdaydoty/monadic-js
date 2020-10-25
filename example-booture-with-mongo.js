/* eslint func-call-spacing: ["error", "always"] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
const [F, FH, { bootstrap }] = [
  require ('fluture'),
  require ('fluture-hooks'),
  require ('booture'),
]

Object.assign (process.env, {
  GCP_PROJECT_ID: '...',
  GCP_KEY_FILENAME: '....json',
  GCP_SECRET_DB_URI: 'projects/...',
  GCP_SECRET_UNI_KEY: 'projects/...,projects/...',
})

const {
  GCP_PROJECT_ID,
  GCP_KEY_FILENAME,
  GCP_SECRET_DB_URI,
  GCP_SECRET_UNI_KEY,
} = process.env

const log = (...args) => console.log (...args)

/**
 * NOTE: To close the mongodb client properly, use mongodb@3.6^
 */

/* acquires */

const acquireConfig = F.attempt (_ => ({
  gcp: {
    projectId: GCP_PROJECT_ID,
    keyFilename: GCP_KEY_FILENAME,
    secretNameForDbUrl: GCP_SECRET_DB_URI,
    secretNameForUnikeyWithKMS: GCP_SECRET_UNI_KEY,
  },
}))

const acquireGcp = ({
  projectId,
  keyFilename,
  secretNameForDbUrl,
  secretNameForUnikeyWithKMS,
}) => F.attemptP (async _ => {
  const R = require ('ramda')
  const { SecretManagerServiceClient } = require ('@google-cloud/secret-manager')
  const { KeyManagementServiceClient } = require ('@google-cloud/kms')

  /* mongodb */

  const secretLens = R.lensPath (['0', 'payload', 'data'])
  const plaintextLens = R.lensPath (['0', 'plaintext'])
  const toString = R.invoker (1, 'toString')

  const credential = { projectId, keyFilename }

  const url = await new SecretManagerServiceClient (R.clone (credential))
    .accessSecretVersion ({ name: secretNameForDbUrl })
    .then (R.view (secretLens))
    .then (toString ('utf8'))

  const mongodb = [url, { useNewUrlParser: true, useUnifiedTopology: true }] // [url, options]

  /* pool */

  const [secretNameForUnikey, kms] = secretNameForUnikeyWithKMS.split (',')

  const cipherUnikey = await new SecretManagerServiceClient (R.clone (credential))
    .accessSecretVersion ({ name: secretNameForUnikey })
    .then (R.view (secretLens))

  const plainUnikey = await new KeyManagementServiceClient (R.clone (credential))
    .decrypt ({ name: kms, ciphertext: cipherUnikey })
    .then (R.view (plaintextLens))
    .then (toString ('hex'))

  const pool = { key: plainUnikey }

  return { mongodb, pool }
})

const acquireMongodb = ([url, options]) => {
  const R = require ('ramda')
  const { MongoClient } = require ('mongodb')
  function registerEvent (client) {
    ;['close', 'error', 'timeout', 'parseError'].forEach (
      event => client.on (event, x => log (`@event:${event}`))
    )
  }
  return F.node (done => MongoClient.connect (url, options, done))
    .pipe (F.map (R.tap (registerEvent)))
}

const closeConnection = client => F.node (done => client.close (false, done))

const acquireApp = (mongodbClient, pool) => F.attempt (_ => {
  return app (mongodbClient, pool)
})

/* bootstrap */

const bootstrappers = Object.values ({
  bootstrapConfig: {
    name: 'config',
    needs: [],
    bootstrap: () => FH.acquire (acquireConfig),
  },

  bootstrapGcp: {
    name: 'gcp',
    needs: ['config'],
    bootstrap: ({ config: { gcp } }) => FH.acquire (acquireGcp (gcp)),
  },

  bootstrapMongodbClient: {
    name: 'mongodbClient',
    needs: ['gcp'],
    bootstrap: ({ gcp: { mongodb } }) => FH.hook (acquireMongodb (mongodb)) (closeConnection),
  },

  bootstrapApp: {
    name: 'app',
    needs: ['mongodbClient', 'gcp'],
    bootstrap: ({ mongodbClient, gcp: { pool } }) => FH.acquire (acquireApp (mongodbClient, pool)),
  },
}) // ∷ [Bootstrapper a b]

const servicesHook = bootstrap (bootstrappers)

const withServices = FH.runHook (servicesHook) // `untagging`: runHook (Hook (h)) = h

const program = withServices (({ app }) => app ())

F.fork (console.error) (console.log) (program)

function app (client, pool) {
  // console.log ({ pool })
  const F = require ('fluture')
  const collectionC = 'collection_c'
  const collectionA = 'collection_a'
  const {
    insertOne,
    withTransaction,
    updateOne,
  } = require ('./example-F-mongodb-wrapper') (client)

  return _ => withTransaction (session => F.go (function * () {
    const options = { session }
    const { count } = yield updateOne (collectionA) ({ _id: 'abc' }, { $inc: { count: 1 } }, options)
    const doc = yield insertOne (collectionC) ({ _id: `test.${count}` }, options)
    return doc
  }))
}
