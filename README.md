# monadic-js

>
> "If you have to ask, you will never know. If you know, you need only ask"
> -- Reader Monad
>

Demo examples for working with

* [fluture](https://github.com/fluture-js/Fluture) the monadic future implementation with helpers:
  * [fluture-node](https://github.com/fluture-js/fluture-node) utils for node
  * [fluture-hooks](https://github.com/fluture-js/fluture-hooks) resource manangement util for fluture
  * [booture](https://github.com/fluture-js/booture) app bootstrapping via fluture-hooks
  * [momi](https://github.com/fluture-js/momi) monadic stateful middlewares for express
  * [fluture-express](https://github.com/fluture-js/fluture-express) (...)

* [express](https://expressjs.com/en/4x/api.html)

* [mongodb](https://mongodb.github.io/node-mongodb-native/3.6/api/)

* gcp-services
  * [key-management-service](https://github.com/googleapis/nodejs-kms)
  * [secret-manager](https://github.com/googleapis/nodejs-secret-manager)

and other FP libs:

* libs
  * [sanctuary](https://sanctuary.js.org/)
  * [sanctuary-def](https://github.com/sanctuary-js/sanctuary-def)
  * [monastic](https://github.com/dicearr/monastic)
  * [partial-lenses](https://github.com/calmm-js/partial.lenses)

---

Demonstrate functional approaches like:

* Use momi's middleware to achieve resource management for transaction session.
* Use momi's middleware (inversion of control) to achieve escape functionality.
* Use partial.lense's `traverse` extract future context out of documents.
* Incorporate express's build-in, momi's, fluture-express's middlewares.
* Incorporate express-validator's middlewares.
* Use `bimap` to achieve asynchronous type-checking for future's container types.
