const F = require ('fluture')
const R = require ('ramda')

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

const rejectNull = value =>
  value == null ? F.reject (new NotFound ()) :
  /* otherwise */ F.resolve (value)

// ∷ MongoClient → String → StrMap ((...) → Future Error *)
module.exports = client => collection => ({
  // ∷ ... → [Doc]
  aggregate (pipeline, options) {
    return F.node (done => client
      .db ()
      .collection (collection)
      .aggregate (pipeline, options)
      .toArray (done))
  },

  // ∷ ... → Cursor
  find (query, options) {
    return F.attempt (_ => client
      .db ()
      .collection (collection)
      .find (query, options))
  },

  // ∷ ... → Null|Doc
  'findOne?' (query, options) {
    return F.node (done => client
      .db ()
      .collection (collection)
      .findOne (query, options, done))
  },

  // ∷ ... → Doc
  findOne (query, options) {
    return this['findOne?'] (query, options)
      .pipe (F.chain (rejectNull))
  },

  // ∷ ... → [Doc]
  findMany (query, options) {
    return F.node (done => client
      .db ()
      .collection (collection)
      .find (query, options)
      .toArray (done))
  },

  // ∷ ... → Doc
  insertOne (doc0, options) {
    const doc = {
      created_at: new Date (),
      updated_at: null,
      ...doc0,
    }
    return F.node (done => client
      .db ()
      .collection (collection)
      .insertOne (doc, options, done))
      .pipe (F.map (({ insertedId: _id }) => ({ ...doc, _id })))
  },

  // ∷ ... → [Doc]
  insertMany (docs0, options) {
    if (R.isEmpty (docs0)) return F.resolve ([])
    const docs = docs0.map (doc => ({
      created_at: new Date (),
      updated_at: null,
      ...doc,
    }))
    const injectId = ({ insertedIds: _ids }) => docs
      .map ((doc, i) => ({ ...doc, _id: _ids[i] }))
    return F.node (done => client
      .db ()
      .collection (collection)
      .insertMany (docs, options, done))
      .pipe (F.map (injectId))
  },

  // ∷ ... → Doc
  updateOne (filter, update0, options0 = {}) {
    if (R.either (R.isNil, R.isEmpty) (update0)) {
      return F.reject (new Error (update0))
    }
    const update = R.mergeDeepLeft (update0, {
      $currentDate: { updated_at: true },
    })
    const options = R.mergeDeepLeft (options0, {
      returnOriginal: false,
    })
    return F.node (done => client
      .db ()
      .collection (collection)
      .findOneAndUpdate (filter, update, options, done))
      .pipe (F.map (({ value }) => value))
  },

  // // ∷ ... → Null|Doc
  // 'updateOne?' (filter, update, options) {
  //   // TODO
  // },

  withTransaction (fn /* ∷ ClientSession → Future x y */, options) {
    const acquire = F.resolve (client.startSession ())
    const dispose = session => F.node (done => session.endSession ({}, done))
    const consume = session => {
      const commitF = F.node (done => session.commitTransaction (done))
      const abortF = F.node (done => session.abortTransaction (done))
      session.startTransaction (options)
      return fn (session)
        .pipe (F.chain (result => F.and (F.resolve (result)) (commitF)))
        .pipe (F.chainRej (err => F.and (F.reject (err)) (abortF)))
    }
    return F.hook (acquire) (dispose) (consume)
  },
})
