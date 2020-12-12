module.exports = {
  isDuplicationError (err) {
    return err.name === 'MongoError' && err.message.startsWith('E11000 ')
  },

  isTransactionError (err) {
    return err.errorLabels &&
      Array.isArray(err.errorLabels) &&
      err.errorLabels.includes('TransientTransactionError')
  },
}
