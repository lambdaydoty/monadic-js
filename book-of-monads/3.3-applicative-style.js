const S = require ('sanctuary')

const ADD3 = x => y => z => x + y + z
const CONCAT3 = ADD3

const map = 'fantasy-land/map'
const ap = 'fantasy-land/ap'

// ADD3 <$> [1,2,3] <*> [4,5,6] <*> [7,8,9]
const sums =
  S.ap
    (S.ap
      (S.map
        (ADD3)
        ([1, 2, 3]))
      ([4, 5, 6]))
    ([7, 8, 9])

// CONCAT3 <$> Just ('A') <*> Just ('B') <*> Just ('C')
const infix =
  S.Just ('C')[ap] (
    S.Just ('B')[ap] (
      S.Just ('A')[map] (CONCAT3)
    )
  )

const prefix =
  S.ap
    (S.ap
      (S.map
        (CONCAT3)
        (S.Just ('a')))
      (S.Just ('b')))
    (S.Just ('c'))

console.log (sums)
console.log (infix)
console.log (prefix)
