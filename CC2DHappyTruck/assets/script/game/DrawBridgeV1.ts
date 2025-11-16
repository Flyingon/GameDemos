import { 
    _decorator, Component, Node, Vec2, input, Input, EventTouch, Graphics, RigidBody2D, PolygonCollider2D, BoxCollider2D,
    Vec3, ERigidBody2DType, Color, UITransform, PhysicsSystem2D, EPhysics2DDrawFlags 
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DrawBridge')
export class DrawBridge extends Component {
    @property(Graphics)
    graphics: Graphics = null; // 在编辑器中拖入 Graphics 组件

    private points: Vec2[] = []; // 存储玩家划线的点
    private lineWidth: number = 5; // 线宽
    private colliderThickness: number = 2; // 让桥梁有一点厚度，防止穿透

    onLoad() {
        // 开启物理调试绘制（可选）
        PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
            EPhysics2DDrawFlags.Pair |
            EPhysics2DDrawFlags.CenterOfMass |
            EPhysics2DDrawFlags.Joint |
            EPhysics2DDrawFlags.Shape;

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
        this.points.push(new Vec2(localPos.x, localPos.y));
        this.graphics.lineTo(localPos.x, localPos.y);
        this.graphics.stroke();
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
        // 获取 UI 坐标并转换为当前节点局部坐标
        const worldPos = event.getUILocation();
        return this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
    }

    createPhysicalBridge() {
        const bridgeNode = new Node('Bridge');

        // ✅ 添加 RigidBody2D 组件
        const rigidBody = bridgeNode.addComponent(RigidBody2D);
        rigidBody.type = ERigidBody2DType.Static;

        // ✅ 解决方案：使用 `PolygonCollider2D` 并创建窄的碰撞体
        const collider = bridgeNode.addComponent(PolygonCollider2D);
        const localPoints: Vec2[] = [];
        
        for (const point of this.points) {
            localPoints.push(new Vec2(point.x, point.y - this.colliderThickness)); // 下边界
        }
        for (let i = this.points.length - 1; i >= 0; i--) {
            localPoints.push(new Vec2(this.points[i].x, this.points[i].y + this.colliderThickness)); // 上边界
        }

        collider.points = localPoints; // 设置碰撞体形状

        // ✅ 设置桥梁位置
        bridgeNode.position = new Vec3(0, 0, 0); // 直接放在世界空间

        // ✅ 添加 Graphics 组件绘制桥梁外观
        const bridgeGraphics = bridgeNode.addComponent(Graphics);
        bridgeGraphics.lineWidth = this.lineWidth;
        bridgeGraphics.strokeColor = new Color(0, 0, 0, 255);

        bridgeGraphics.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            bridgeGraphics.lineTo(this.points[i].x, this.points[i].y);
        }
        bridgeGraphics.stroke();

        console.log(`桥梁已生成，总点数: ${this.points.length}`);
        this.node.parent.addChild(bridgeNode);
    }
}
