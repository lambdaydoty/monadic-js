# Transaction Sketch

## Request

0. Parameters: `currency`, `account`, `values` (`model`?)
1. `BuildTx`
2. `SignTx`
3. `Rebalance (A)`
4. `Rebalance (B)`
5. ...
6. `InsertOne (...)` <-- *Uniqueness*

## Cron

0. Parameters: `doc`, `model`,
1. `SendTx` <-- *Idenpoetent*
2. `UpdateOne (...)`
