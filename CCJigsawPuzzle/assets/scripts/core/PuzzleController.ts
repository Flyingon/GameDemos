import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D, UITransform, UIOpacity, Size, Vec3, Label, tween, Color, Rect } from 'cc'
import { computeGridPiecesMeta } from './GridSlicer'
import { GridParams } from './types'
import { PieceNode } from './PieceNode'
import { saveJSON, loadJSON, remove as removeSave } from '../services/SaveService'
const { ccclass, property } = _decorator

@ccclass('PuzzleController')
export class PuzzleController extends Component {
  @property(Node)
  board!: Node

  @property(Node)
  tray!: Node

  texture: Texture2D | null = null
  ghost: Node | null = null
  edgeOnlyOnBoard = false
  rows = 0
  cols = 0
  rotationEnabled = false
  selectedPiece: PieceNode | null = null
  elapsedSeconds = 0
  completed = false
  completeOverlay: Node | null = null

  async initWithTexture(texture: Texture2D, rows = 4, cols = 6) {
    this.texture = texture
    const boardUI = this.board.getComponent(UITransform)!
    const imgW = texture.width
    const imgH = texture.height
    const params: GridParams = {
      rows,
      cols,
      imageWidth: imgW,
      imageHeight: imgH,
      boardWidth: boardUI.width,
      boardHeight: boardUI.height,
      padding: 16,
    }
    this.rows = rows
    this.cols = cols
    const metas = computeGridPiecesMeta(params)
    this.clearPieces()
    this.spawnPieces(metas)
    this.loadProgressIfAvailable()
    this.startTimer()
  }

  private spawnPieces(metas: ReturnType<typeof computeGridPiecesMeta>) {
    if (!this.texture) return
    const boardUI = this.board.getComponent(UITransform)!
    const trayUI = this.tray.getComponent(UITransform)!
    const tex = this.texture
    metas.forEach(meta => {
      const node = new Node(`piece-${meta.id}`)
      const sprite = node.addComponent(Sprite)
      const sf = new SpriteFrame()
      sf.texture = tex
      sf.rect = new Rect(meta.rect.x, meta.rect.y, meta.rect.width, meta.rect.height)
      sprite.spriteFrame = sf
      const ui = node.addComponent(UITransform)
      ui.setContentSize(meta.displayWidth, meta.displayHeight)
      const piece = node.addComponent(PieceNode)
      piece.id = meta.id
      piece.row = meta.row
      piece.col = meta.col
      piece.setTarget(meta.targetPos, meta.targetRot)
      piece.controller = this
      const parent = this.edgeOnlyOnBoard && !meta.isEdge ? this.tray : this.board
      parent.addChild(node)
      const pos = parent === this.tray ? this.randomPosIn(this.tray) : this.randomPosIn(this.board)
      node.setPosition(pos)
      const initRot = this.rotationEnabled ? [0, 90, 180, 270][Math.floor(Math.random() * 4)] : 0
      piece.setRotationDeg(initRot)
    })
  }

  setEdgeOnlyOnBoard(v: boolean) {
    this.edgeOnlyOnBoard = v
    if (!this.texture) return
    const pieces = this.getPieces()
    pieces.forEach(p => {
      if (p.locked) return
      const isEdge = p.row === 0 || p.col === 0 || p.row === this.rows - 1 || p.col === this.cols - 1
      const parent = this.edgeOnlyOnBoard && !isEdge ? this.tray : this.board
      if (p.node.parent !== parent) parent.addChild(p.node)
      const pos = parent === this.tray ? this.randomPosIn(this.tray) : this.randomPosIn(this.board)
      p.node.setPosition(pos)
    })
    this.requestSave()
  }

  setGhostEnabled(v: boolean) {
    if (!this.texture) return
    if (v) {
      if (!this.ghost) {
        const n = new Node('ghost')
        const sp = n.addComponent(Sprite)
        const sf = new SpriteFrame()
        sf.texture = this.texture
        sp.spriteFrame = sf
        const ui = n.addComponent(UITransform)
        const size = this.scaledImageSize()
        ui.setContentSize(size.width, size.height)
        const op = n.addComponent(UIOpacity)
        op.opacity = 80
        this.board.addChild(n)
        n.setPosition(0, 0)
        this.ghost = n
      }
      this.ghost.active = true
    } else {
      if (this.ghost) this.ghost.active = false
    }
    this.requestSave()
  }

  private scaledImageSize(): Size {
    const boardUI = this.board.getComponent(UITransform)!
    const imgW = this.texture!.width
    const imgH = this.texture!.height
    const scale = Math.min(boardUI.width / imgW, boardUI.height / imgH)
    return new Size(imgW * scale, imgH * scale)
  }

  private getPieces(): PieceNode[] {
    const arr: PieceNode[] = []
    const collect = (parent: Node) => parent.children.forEach(n => { const c = n.getComponent(PieceNode); if (c) arr.push(c) })
    collect(this.board)
    collect(this.tray)
    return arr
  }

  private getRows(): number { return this.rows }
  private getCols(): number { return this.cols }

  private randomPosIn(node: Node): Vec3 {
    const ui = node.getComponent(UITransform)!
    const x = (Math.random() - 0.5) * ui.width
    const y = (Math.random() - 0.5) * ui.height
    return new Vec3(x, y, 0)
  }

  private clearPieces() {
    const removeFrom = (parent: Node) => {
      const toRemove = parent.children.filter(n => n.name.startsWith('piece-'))
      toRemove.forEach(n => n.removeFromParent())
    }
    removeFrom(this.board)
    removeFrom(this.tray)
    if (this.ghost) { this.ghost.removeFromParent(); this.ghost = null }
  }

  onPieceSelected(p: PieceNode) {
    this.selectedPiece = p
  }

  setRotationEnabled(v: boolean) {
    this.rotationEnabled = v
    this.requestSave()
  }

  rotateSelectedBy90() {
    if (!this.rotationEnabled) return
    const p = this.selectedPiece
    if (!p || p.locked) return
    p.rotateBy90()
    this.requestSave()
  }

  onPieceLocked(p: PieceNode) {
    this.requestSave()
    this.checkCompletion()
  }

  private getProgressKey(): string {
    if (!this.texture) return ''
    return `puzzle:${this.texture.width}x${this.texture.height}:${this.rows}x${this.cols}`
  }

  requestSave() {
    if (!this.texture) return
    const key = this.getProgressKey()
    const data = {
      rows: this.rows,
      cols: this.cols,
      rotationEnabled: this.rotationEnabled,
      edgeOnlyOnBoard: this.edgeOnlyOnBoard,
      ghostEnabled: !!this.ghost && this.ghost.active,
      elapsedSeconds: this.elapsedSeconds,
      pieces: this.getPieces().map(p => ({
        id: p.id,
        x: p.node.position.x,
        y: p.node.position.y,
        rot: p.currentRot,
        locked: p.locked,
        parent: p.node.parent === this.board ? 'board' : 'tray',
      })),
    }
    saveJSON(key, data)
  }

  loadProgressIfAvailable() {
    const key = this.getProgressKey()
    const data = loadJSON<any>(key)
    if (!data) return
    this.rotationEnabled = !!data.rotationEnabled
    this.edgeOnlyOnBoard = !!data.edgeOnlyOnBoard
    this.elapsedSeconds = data.elapsedSeconds || 0
    if (data.ghostEnabled) this.setGhostEnabled(true)
    const map = new Map<number, any>()
    for (const it of data.pieces || []) map.set(it.id, it)
    const pieces = this.getPieces()
    pieces.forEach(p => {
      const st = map.get(p.id)
      if (!st) return
      const parent = st.parent === 'tray' ? this.tray : this.board
      if (p.node.parent !== parent) parent.addChild(p.node)
      p.node.setPosition(st.x, st.y)
      p.setRotationDeg(st.rot || 0)
      p.locked = !!st.locked
      if (p.locked) p.node.setPosition(p.targetPos.x, p.targetPos.y)
    })
  }

  private startTimer() {
    this.completed = false
    this.unschedule(this.tickTimer)
    this.schedule(this.tickTimer, 1)
  }

  private stopTimer() {
    this.unschedule(this.tickTimer)
  }

  private tickTimer = () => {
    if (this.completed) return
    this.elapsedSeconds++
    this.requestSave()
  }

  private checkCompletion() {
    const total = this.rows * this.cols
    const locked = this.getPieces().filter(p => p.locked).length
    if (locked >= total && !this.completed) {
      this.completed = true
      this.stopTimer()
      this.showCompleteOverlay()
      const key = this.getProgressKey()
      removeSave(key)
    }
  }

  private showCompleteOverlay() {
    const n = this.completeOverlay || new Node('completeOverlay')
    if (!this.completeOverlay) {
      const ui = n.addComponent(UITransform)
      const s = this.scaledImageSize()
      ui.setContentSize(s.width, s.height)
      const labNode = new Node('label')
      const lab = labNode.addComponent(Label)
      lab.string = '完成!'
      lab.color = Color.GREEN
      n.addChild(labNode)
      this.board.addChild(n)
      this.completeOverlay = n
    }
    n.setPosition(0, 0)
    const op = n.getComponent(UIOpacity) || n.addComponent(UIOpacity)
    op.opacity = 0
    tween(op).to(0.3, { opacity: 255 }).to(0.3, { opacity: 0 }).to(0.3, { opacity: 255 }).start()
  }
}