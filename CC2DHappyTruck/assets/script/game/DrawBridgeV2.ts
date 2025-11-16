import { 
    _decorator, Component, Node, Vec2, input, Input, EventTouch, Graphics, RigidBody2D, BoxCollider2D,
    Vec3, ERigidBody2DType, Color, UITransform, PhysicsSystem2D, EPhysics2DDrawFlags, Size
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DrawBridge')
export class DrawBridge extends Component {
    @property(Graphics)
    graphics: Graphics = null; // 在编辑器中拖入 Graphics 组件

    private points: Vec2[] = []; // 存储玩家划线的点
    private lineWidth: number = 5; // 线宽
    private segmentLength: number = 20; // 每段最小分割长度，合并小段
    private colliderThickness: number = 5; // 让桥梁有厚度，防止小车掉下去

    onLoad() {
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
        if (this.points.length === 0 || Vec2.distance(this.points[this.points.length - 1], new Vec2(localPos.x, localPos.y)) > this.segmentLength) {
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
        
        let mergedStart = this.points[0];

        for (let i = 1; i < this.points.length; i++) {
            const start = mergedStart;
            const end = this.points[i];

            // 计算线段长度
            const length = Vec2.distance(start, end);

            // 如果下一段距离太短，就跳过，合并下一段
            if (length < this.segmentLength) {
                continue;
            }

            // 计算中心点和角度
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

            // 创建桥段
            const segmentNode = new Node(`BridgeSegment_${i}`);
            const rigidBody = segmentNode.addComponent(RigidBody2D);
            rigidBody.type = ERigidBody2DType.Static;

            // 添加 `BoxCollider2D`
            const collider = segmentNode.addComponent(BoxCollider2D);
            collider.size = new Size(length, this.colliderThickness); // 变厚一点
            collider.offset = new Vec2(0, 0);

            // 设定桥的位置和角度
            segmentNode.setPosition(centerX, centerY);
            segmentNode.setRotationFromEuler(0, 0, angle);

            // 添加绘图组件
            const segmentGraphics = segmentNode.addComponent(Graphics);
            segmentGraphics.lineWidth = this.lineWidth;
            segmentGraphics.strokeColor = new Color(0, 0, 0, 255);

            segmentGraphics.moveTo(start.x - centerX, start.y - centerY);
            segmentGraphics.lineTo(end.x - centerX, end.y - centerY);
            segmentGraphics.stroke();

            this.node.parent.addChild(segmentNode);

            // 更新合并的起点
            mergedStart = end;
        }
    }
}
