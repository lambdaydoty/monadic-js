/* eslint func-call-spacing: ["error", "always"] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
const F = require ('fluture')
const R = require ('ramda')
const S = require ('sanctuary').unchecked

// const { } = process.env

// ∷ ... → Curosr
const aggregate = client => collection => (pipeline, opts) => F.node (done => client
  .db ()
  .collection (collection)
  .aggregate (pipeline, opts, done))

// ∷ ... → Cursor
const find = client => collection => (query, opts) => F.attempt (_ => client
  .db ()
  .collection (collection)
  .find (query, opts))

// ∷ ... → Null|Doc
const findOne = client => collection => (query, opts) => F.node (done => client
  .db ()
  .collection (collection)
  .findOne (query, opts, done))

// ∷ ... → Cursor
const findMany = client => collection => (query, opts) => F.node (done => client
  .db ()
  .collection (collection)
  .find (query, opts)
  .toArray (done))

// ∷ ... → Doc
const insertOne = client => collection => (doc_, opts) => {
  const doc = {
    created_at: new Date (),
    updated_at: null,
    ...doc_,
  }
  return F.node (done => client
    .db ()
    .collection (collection)
    .insertOne (doc, opts, done))
    .pipe (F.map (({ insertedId: _id }) => ({ ...doc, _id })))
}

// ∷ ... → [Doc]
const insertMany = client => collection => (docs_, opts) => {
  if (docs_.length === 0) return F.resolve ([])
  const docs = docs_.map (d => ({
    created_at: new Date (),
    updated_at: null,
    ...d,
  }))
  return F.node (done => client
    .db ()
    .collection (collection)
    .insertMany (docs, opts, done))
    .pipe (F.map (({ insertedIds: _ids }) => docs
      .map ((doc, i) => ({ ...doc, _id: _ids[i] }))))
}

// ∷ ... → Doc
const updateOne = client => collection => (filter, update_, opts_) => {
  const update = R.mergeDeepLeft (update_, {
    $currentDate: { updated_at: true },
  })
  const opts = R.mergeDeepLeft (opts_, {
    returnOriginal: false,
  })
  return F.node (done => client
    .db ()
    .collection (collection)
    .findOneAndUpdate (filter, update, opts, done))
    .pipe (F.map (({ value }) => value))
}

const withTransaction = client => (fn /* ∷ ClientSession → Future x y */, opts) => {
  const acquire = F.resolve (client.startSession ())
  const dispose = session => F.node (done => session.endSession ({}, done))
  const consume = session => {
    const [commitF, abortF] = [
      F.node (done => session.commitTransaction (done)),
      F.node (done => session.abortTransaction (done)),
    ]
    session.startTransaction (opts)
    return fn (session)
      .pipe (F.chain (result => F.and (F.resolve (result)) (commitF)))
      .pipe (F.chainRej (err => F.and (F.reject (err)) (abortF)))
  }
  return F.hook (acquire) (dispose) (consume)
}

// const updateMany
// const deleteOne
// const deleteMany

class NotFound extends Error {
  constructor (...args) {
    super (...args)
    Object.assign (this, {
      name: 'NotFound',
      status: 404,
      message: this.message || 'Not Found',
    })
  }
}

const rejectNull = value => value == null
  ? F.reject (new NotFound ())
  : F.resolve (value)

const escapeWith = escapor => f => client => collection => (...args) =>
  S.chain (escapor) (f (client) (collection) (...args))

// ∷ MongoClient → StrMap Function
module.exports = S.flip ({
  aggregate,
  find,
  findMany,
  insertOne,
  insertMany,
  'findOne?': findOne,
  'updateOne?': updateOne,
  findOne: escapeWith (rejectNull) (findOne),
  updateOne: escapeWith (rejectNull) (updateOne),
  withTransaction,
})
