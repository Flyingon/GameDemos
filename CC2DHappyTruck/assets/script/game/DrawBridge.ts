import { 
    _decorator, Component, Node, Vec2, input, Input, EventTouch, Graphics, RigidBody2D, PolygonCollider2D,
    Vec3, ERigidBody2DType, Color, UITransform, PhysicsSystem2D, EPhysics2DDrawFlags
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DrawBridge')
export class DrawBridge extends Component {
    @property(Graphics)
    graphics: Graphics = null; // 在编辑器中拖入 Graphics 组件

    private points: Vec2[] = []; // 存储玩家划线的点
    private lineWidth: number = 5; // 线宽
    private segmentLength: number = 1; // ✅ 每段桥的最小分割长度
    private colliderThickness: number = 1; // ✅ 碰撞体厚度，防止小车掉下去

    private bridgeSegments: Node[] = []; // 存储所有桥梁段节点

    onLoad() {
        // 开启物理引擎的 debug
        // PhysicsSystem2D.instance.debugDrawFlags =
        //  EPhysics2DDrawFlags.Aabb |
        //     EPhysics2DDrawFlags.Pair |
        //     EPhysics2DDrawFlags.CenterOfMass |
        //     EPhysics2DDrawFlags.Joint |
        //     EPhysics2DDrawFlags.Shape;

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        this.graphics.lineWidth = this.lineWidth; // 设置玩家绘制线条的宽度
    }

    onTouchStart(event: EventTouch) {
        this.points = [];
        const localPos = this.getTouchPosition(event);
        this.points.push(new Vec2(localPos.x, localPos.y));
        this.graphics.clear();
        this.graphics.moveTo(localPos.x, localPos.y);
    }

    onTouchMove(event: EventTouch) {
        const localPos = this.getTouchPosition(event);
        if (this.points.length === 0 || Vec2.distance(this.points[this.points.length - 1], new Vec2(localPos.x, localPos.y)) > 5) {
            this.points.push(new Vec2(localPos.x, localPos.y));
            this.graphics.lineTo(localPos.x, localPos.y);
            this.graphics.stroke();
        }
    }

    onTouchEnd(event: EventTouch) {
        if (this.points.length < 2) {
            console.warn("桥梁绘制点数不足");
            return;
        }

        this.createPhysicalBridge();
        this.graphics.clear(); // 清空绘制的线，交给物理桥梁显示
    }

    getTouchPosition(event: EventTouch): Vec3 {
        const worldPos = event.getUILocation();
        return this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
    }

    createPhysicalBridge() {
        console.log(`创建桥梁，共 ${this.points.length} 个点`);

        let segmentStart = this.points[0];

        for (let i = 1; i < this.points.length; i++) {
            const segmentEnd = this.points[i];

            // ✅ 计算线段长度
            const length = Vec2.distance(segmentStart, segmentEnd);

            // ✅ 如果当前段的长度不足 `segmentLength`，则继续累积
            if (length < this.segmentLength) {
                continue;
            }

            // ✅ 计算桥梁的中心点，确保刚体和线条对齐
            const centerX = (segmentStart.x + segmentEnd.x) / 2;
            const centerY = (segmentStart.y + segmentEnd.y) / 2;

            // ✅ 创建桥梁段
            const segmentNode = new Node(`BridgeSegment_${i}`);
            const rigidBody = segmentNode.addComponent(RigidBody2D);
            rigidBody.type = ERigidBody2DType.Static;

            // ✅ 使用 `PolygonCollider2D`，严格沿着画线扩展
            const collider = segmentNode.addComponent(PolygonCollider2D);
            const localPoints: Vec2[] = [];

            // ✅ 让 `PolygonCollider2D` 仅在 `y` 方向扩展 `colliderThickness`
            localPoints.push(new Vec2(segmentStart.x, segmentStart.y - this.colliderThickness)); // 下边界
            localPoints.push(new Vec2(segmentEnd.x, segmentEnd.y - this.colliderThickness)); // 下边界
            localPoints.push(new Vec2(segmentEnd.x, segmentEnd.y + this.colliderThickness)); // 上边界
            localPoints.push(new Vec2(segmentStart.x, segmentStart.y + this.colliderThickness)); // 上边界

            collider.points = localPoints; // ✅ 赋值碰撞体

            // ✅ 设定桥梁段的位置，确保无缝衔接
            segmentNode.setPosition(0, 0); // 直接放置在世界空间，避免偏移

            // ✅ 添加 Graphics 组件绘制桥梁外观
            const segmentGraphics = segmentNode.addComponent(Graphics);
            segmentGraphics.lineWidth = this.lineWidth;
            segmentGraphics.strokeColor = new Color(0, 0, 0, 255);

            segmentGraphics.moveTo(segmentStart.x, segmentStart.y);
            segmentGraphics.lineTo(segmentEnd.x, segmentEnd.y);
            segmentGraphics.stroke();

            this.node.parent.addChild(segmentNode);

            // ✅ 将桥梁段节点存储到数组中
            this.bridgeSegments.push(segmentNode);

            // ✅ 更新下一段的起点
            segmentStart = segmentEnd;
        }
    }

    /**
     * 清除所有桥梁段节点
     */
    clearPhysicalBridge() {
        for (const segment of this.bridgeSegments) {
            segment.destroy(); // 销毁节点
        }
        this.bridgeSegments = []; // 清空数组
        console.log("已清除所有桥梁段");
    }
}