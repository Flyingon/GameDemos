import { _decorator, Component, Node, UITransform, Canvas, view, Size, Label, Color, Button, Sprite, EventHandler } from 'cc'
import { selectFileAndLoadTexture } from './ImageLoader'
import { PuzzleController } from '../core/PuzzleController'
const { ccclass, property } = _decorator

@ccclass('GameEntry')
export class GameEntry extends Component {
  @property(Node)
  board!: Node

  @property(Node)
  tray!: Node

  @property(PuzzleController)
  controller!: PuzzleController

  rows = 4
  cols = 6
  presets: Array<[number, number]> = [[3,4],[4,6],[6,8],[8,10]]
  presetIndex = 1
  timeLabel: Label | null = null

  async start() {
    this.ensureLayout()
    this.buildToolbar()
    this.schedule(this.updateTimerLabel.bind(this), 1)
    try {
      const tex = await selectFileAndLoadTexture()
      await this.controller.initWithTexture(tex, this.rows, this.cols)
    } catch {
      this.showUploadHint()
    }
  }

  private ensureLayout() {
    const root = this.node.scene.getComponentInChildren(Canvas)?.node || this.node
    if (!this.board) {
      this.board = new Node('Board')
      const ui = this.board.addComponent(UITransform)
      const s = this.getCanvasSize()
      ui.setContentSize(s.width * 0.8, s.height * 0.8)
      root.addChild(this.board)
      this.board.setPosition(0, s.height * 0.05)
    }
    if (!this.tray) {
      this.tray = new Node('Tray')
      const ui = this.tray.addComponent(UITransform)
      const s = this.getCanvasSize()
      ui.setContentSize(s.width * 0.9, s.height * 0.2)
      root.addChild(this.tray)
      this.tray.setPosition(0, -s.height * 0.35)
    }
    if (!this.controller) {
      this.controller = this.node.addComponent(PuzzleController)
      this.controller.board = this.board
      this.controller.tray = this.tray
    }
  }

  private getCanvasSize(): Size {
    const vp = view.getVisibleSize()
    return new Size(vp.width, vp.height)
  }

  private buildToolbar() {
    const root = this.node.scene.getComponentInChildren(Canvas)?.node || this.node
    const bar = new Node('Toolbar')
    const ui = bar.addComponent(UITransform)
    const s = this.getCanvasSize()
    ui.setContentSize(s.width, 50)
    root.addChild(bar)
    bar.setPosition(0, s.height * 0.45)

    this.createButton(bar, '上传图片', -260, 0, '_onUploadClick')

    let ghostOn = false
    this.createButton(bar, '幽灵图', -80, 0, '_onGhostClick')

    let edgeOnly = false
    this.createButton(bar, '只看边角', 100, 0, '_onEdgeOnlyClick')

    let rotationOn = false
    this.createButton(bar, '旋转玩法', 280, 0, '_onRotateModeClick')

    this.createButton(bar, '旋转选中', 460, 0, '_onRotateSelectedClick')

    this.createButton(bar, `难度 ${this.rows}×${this.cols}`, 640, 0, '_onDifficultyClick')

    this.createButton(bar, '保存进度', 820, 0, '_onSaveClick')
    this.createButton(bar, '恢复进度', 1000, 0, '_onLoadClick')

    const tlNode = new Node('timeLabel')
    const tlUI = tlNode.addComponent(UITransform)
    tlUI.setContentSize(160, 40)
    const lab = tlNode.addComponent(Label)
    lab.string = '时间 0s'
    lab.color = Color.WHITE
    bar.addChild(tlNode)
    tlNode.setPosition(1180, 0)
    this.timeLabel = lab
  }

  private showUploadHint() {
    const hint = new Node('uploadHint')
    const ui = hint.addComponent(UITransform)
    ui.setContentSize(300, 40)
    const lab = hint.addComponent(Label)
    lab.string = '点击上方“上传图片”开始拼图'
    lab.color = Color.WHITE
    const s = this.getCanvasSize()
    this.board.addChild(hint)
    hint.setPosition(0, s.height * 0.02)
  }

  private updateTimerLabel() {
    if (!this.timeLabel) return
    const t = this.controller.elapsedSeconds
    this.timeLabel.string = `时间 ${t}s`
  }

  private createButton(parent: Node, text: string, x: number, y: number, handler: string) {
    const n = new Node(text)
    const ui = n.addComponent(UITransform)
    ui.setContentSize(160, 44)
    const bg = new Node('bg')
    const bgUI = bg.addComponent(UITransform)
    bgUI.setContentSize(160, 44)
    const bgSp = bg.addComponent(Sprite)
    bgSp.color = new Color(40, 40, 40, 200)
    const labelNode = new Node('label')
    const labUI = labelNode.addComponent(UITransform)
    labUI.setContentSize(160, 44)
    const lab = labelNode.addComponent(Label)
    lab.string = text
    lab.color = Color.WHITE
    n.addChild(bg)
    n.addChild(labelNode)
    parent.addChild(n)
    n.setPosition(x, y)
    const btn = n.addComponent(Button)
    btn.transition = Button.Transition.NONE
    const eh = new EventHandler()
    eh.target = this.node
    eh.component = 'GameEntry'
    eh.handler = handler
    btn.clickEvents.push(eh)
  }

  _onUploadClick() {
    selectFileAndLoadTexture().then(tex => this.controller.initWithTexture(tex, this.rows, this.cols)).catch(() => this.showUploadHint())
  }

  _onGhostClick() {
    const enabled = !this.controller.ghost || !this.controller.ghost.active
    this.controller.setGhostEnabled(enabled)
  }

  _onEdgeOnlyClick() { this.controller.setEdgeOnlyOnBoard(!this.controller.edgeOnlyOnBoard) }

  _onRotateModeClick() { this.controller.setRotationEnabled(!this.controller.rotationEnabled) }

  _onRotateSelectedClick() { this.controller.rotateSelectedBy90() }

  _onDifficultyClick() {
    this.presetIndex = (this.presetIndex + 1) % this.presets.length
    const [r, c] = this.presets[this.presetIndex]
    this.rows = r
    this.cols = c
    if (this.controller.texture) this.controller.initWithTexture(this.controller.texture, this.rows, this.cols)
  }

  _onSaveClick() { this.controller.requestSave() }
  _onLoadClick() { this.controller.loadProgressIfAvailable() }
}