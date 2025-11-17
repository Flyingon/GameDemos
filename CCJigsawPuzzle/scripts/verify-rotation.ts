import assert from 'assert'
import { angleDiff, canSnap } from '../assets/scripts/core/SnapManager'

assert.strictEqual(angleDiff(0, 0), 0)
assert.strictEqual(angleDiff(0, 90), 90)
assert.strictEqual(angleDiff(350, 10), 20)
assert.strictEqual(angleDiff(180, 0), 180)

const ok = canSnap({x:0,y:0}, {x:0,y:0}, 90, 90, { distanceThreshold: 5, angleThreshold: 0 })
assert.strictEqual(ok, true)
const ng = canSnap({x:0,y:0}, {x:0,y:0}, 90, 0, { distanceThreshold: 5, angleThreshold: 0 })
assert.strictEqual(ng, false)

console.log('Rotation/Snap checks passed')