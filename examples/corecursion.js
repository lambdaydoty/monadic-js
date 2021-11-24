const { unchecked: S } = require ('sanctuary')

const fib = S.unfoldr
  (([a, b]) => a > 20 ?
    S.Nothing :
    S.Just (S.Pair (a) ([b, a + b])))
  ([0, 1])

console.log ({ fib })

const fact = S.unfoldr
  (([n, acc]) => n > 10 ?
    S.Nothing :
    S.Just (S.Pair (acc) ([n + 1, (n + 1) * acc])))
  ([0, 1])

console.log ({ fact })

const left = i => i * 2
const right = i => i * 2 + 1
const root = 1
const isLeaf = i => i >= 8 && i <= 15

// ∷ (b → a) → (b → x → y → z) → Tree b → z
const BTfold = fn => op => n => {
  if (isLeaf (n)) return fn (n)
  return op
    (n)
    (BTfold (fn) (op) (left (n)))
    (BTfold (fn) (op) (right (n)))
}

const dfs = BTfold
  (n => [n])
  (n => l => r => [n, ...l, ...r])

const bfs = S.unfoldr
  (([n, ...ns]) => n === undefined ?
    S.Nothing :
    S.Just (S.Pair (n) ([...ns, ...(isLeaf (n) ? [] : [left (n), right (n)])])))

const traversalDfs = dfs (root)
const traversalBfs = bfs ([root])

console.log ({ traversalDfs })
console.log ({ traversalBfs })

// const dfs = n => {
//   if (isLeaf (n)) return ' ' + n
//   return (
//     ' ' + n +
//     dfs (left (n)) +
//     dfs (right (n))
//   )
// }
