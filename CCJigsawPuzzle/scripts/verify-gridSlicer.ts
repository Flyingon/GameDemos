import assert from 'assert'
import { computeGridPiecesMeta } from '../assets/scripts/core/GridSlicer'

const metas = computeGridPiecesMeta({
  rows: 3,
  cols: 4,
  imageWidth: 400,
  imageHeight: 300,
  boardWidth: 800,
  boardHeight: 600,
  padding: 0,
})

assert.strictEqual(metas.length, 12)

const pieceW = 400 / 4
const pieceH = 300 / 3

assert.strictEqual(metas[0].rect.x, 0)
assert.strictEqual(metas[0].rect.y, 0)
assert.strictEqual(metas[0].rect.width, pieceW)
assert.strictEqual(metas[0].rect.height, pieceH)

const last = metas[metas.length - 1]
assert.strictEqual(last.row, 2)
assert.strictEqual(last.col, 3)
assert.strictEqual(last.rect.x, 3 * pieceW)
assert.strictEqual(last.rect.y, 2 * pieceH)

const edges = metas.filter(m => m.isEdge).length
assert.strictEqual(edges, (3 * 2) + (4 - 2) * 2)

const uniqueTargets = new Set(metas.map(m => `${Math.round(m.targetPos.x)}-${Math.round(m.targetPos.y)}`))
assert.strictEqual(uniqueTargets.size, metas.length)

console.log('GridSlicer basic checks passed with', metas.length, 'pieces')