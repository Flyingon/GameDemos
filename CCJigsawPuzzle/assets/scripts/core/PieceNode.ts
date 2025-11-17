import { _decorator, Component, Node, Sprite, UITransform, Vec3, EventTouch } from 'cc'
import { Vec2 } from './types'
import { canSnap } from './SnapManager'
import { PuzzleController } from './PuzzleController'
const { ccclass, property } = _decorator

@ccclass('PieceNode')
export class PieceNode extends Component {
  @property
  id = 0
  @property
  row = 0
  @property
  col = 0
  targetPos: Vec2 = { x: 0, y: 0 }
  targetRot = 0
  locked = false
  currentRot = 0
  controller: PuzzleController | null = null

  private _dragOffset = new Vec3()

  onEnable() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
  }

  onDisable() {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
  }

  setTarget(pos: Vec2, rot: number) {
    this.targetPos = pos
    this.targetRot = rot
  }

  setRotationDeg(deg: number) {
    this.currentRot = ((deg % 360) + 360) % 360
    this.node.angle = this.currentRot
  }

  rotateBy90() {
    if (this.locked) return
    this.setRotationDeg(this.currentRot + 90)
  }

  private uiToParentSpace(x: number, y: number): Vec3 {
    const parent = this.node.parent
    if (!parent) return new Vec3(x, y, 0)
    const pUI = parent.getComponent(UITransform)
    if (!pUI) return new Vec3(x, y, 0)
    return pUI.convertToNodeSpaceAR(new Vec3(x, y, 0))
  }

  private onTouchStart(e: EventTouch) {
    if (this.locked) return
    if (this.controller) this.controller.onPieceSelected(this)
    const loc = e.getUILocation()
    const local = this.uiToParentSpace(loc.x, loc.y)
    this._dragOffset.set(local.x - this.node.position.x, local.y - this.node.position.y, 0)
    this.node.setSiblingIndex(9999)
  }

  private onTouchMove(e: EventTouch) {
    if (this.locked) return
    const loc = e.getUILocation()
    const local = this.uiToParentSpace(loc.x, loc.y)
    this.node.setPosition(local.x - this._dragOffset.x, local.y - this._dragOffset.y)
  }

  private onTouchEnd() {
    if (this.locked) return
    const pos2: Vec2 = { x: this.node.position.x, y: this.node.position.y }
    const can = canSnap(pos2, this.targetPos, this.currentRot, this.targetRot, { distanceThreshold: 12, angleThreshold: 0 })
    if (can) {
      this.node.setPosition(this.targetPos.x, this.targetPos.y)
      this.setRotationDeg(this.targetRot)
      this.locked = true
      if (this.controller) this.controller.onPieceLocked(this)
    }
    if (this.controller) this.controller.requestSave()
  }
}