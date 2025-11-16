import {
    _decorator, Component, Vec2, Node, Button, Contact2DType, WheelJoint2D, Vec3, Quat, Collider2D, IPhysics2DContact, director, Label, log, RigidBody2D
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TruckControl')
export class TruckControl extends Component {
    @property
    speed: number = 0; // 轮子转动速度

    @property(Node)
    truckBody: Node = null; // 卡车车体

    @property(Node)
    backWheel: Node = null; // 左轮子的 RigidBody2D

    @property(Node)
    frontWheel: Node = null; // 右轮子的 RigidBody2D

    private backJoint: WheelJoint2D = null; // 左轮子的 WheelJoint2D
    private frontJoint: WheelJoint2D = null; // 右轮子的 WheelJoint2D

    private currentSpeed: number = 0;
    private maxSpeed: number = 40; // 最大角速度
    private acceleration: number = 5; // 每秒增加多少角速度
    private isAccelerating: boolean = false;

    onLoad() {
        // 获取卡车的碰撞组件
        const collider = this.truckBody.getComponent(Collider2D);
        if (collider) {
            // 监听碰撞事件
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            console.log("✅ Truck 碰撞检测已开启");
            collider.density = 1.5; // Try a lower value for lighter mass
            collider.apply(); // Important: apply changes!
            console.log('🚚 车体密度已设置:', collider.density);
        } else {
            console.error("🚨 TruckBody 没有 Collider2D 组件！");
        }

        const colliders = this.truckBody.getComponents(Collider2D);
        colliders.forEach((col, idx) => {
            console.log(`Collider${idx} offset:`, col.offset, 'size:', (col as any).size || (col as any).radius);
        });
    }

    start() {
        // 获取轮子的 WheelJoint2D 组件
        this.initTruck();
        this.currentSpeed = 0;
        this.isAccelerating = false;
    }

    /**
     * 初始化卡车，参数
     */
    initTruck() {
        this.backJoint = this.backWheel.getComponent(WheelJoint2D);
        this.frontJoint = this.frontWheel.getComponent(WheelJoint2D);

        // this.leftJoint.frequency = 10; // 适当增加频率 
        // this.leftJoint.dampingRatio  = 0.8;  // 适当增加阻尼比
        // this.rightJoint.frequency = 10; // 适当增加频率 
        // this.rightJoint.dampingRatio  = 0.8;  // 适当增加阻尼比
        // this.speed = 30;
        this.backJoint.maxMotorTorque = 1500;
        this.frontJoint.maxMotorTorque = 1500;

        const backCollider = this.backWheel.getComponent(Collider2D);
        const frontCollider = this.frontWheel.getComponent(Collider2D);
        if (backCollider) { backCollider.friction = 2; backCollider.apply(); }
        if (frontCollider) { frontCollider.friction = 2; frontCollider.apply(); }
    }

    /**
     * 设置轮子的电机速度
     * @param speed 速度值
     */
    setMotorSpeed(speed: number) {
        this.backJoint.motorSpeed = speed;
        this.frontJoint.motorSpeed = speed;
    }

    /**
     * 启动小车
     */
    startMoving() {
        this.isAccelerating = true;
        console.log("卡车启动！（加速模式）");
        console.log("🚗 启动参数:", {
            maxSpeed: this.maxSpeed,
            acceleration: this.acceleration,
            backJoint_maxMotorTorque: this.backJoint?.maxMotorTorque,
            frontJoint_maxMotorTorque: this.frontJoint?.maxMotorTorque
        });
    }

    /**
     * 启动小车
     */
    stopMoving() {
        this.isAccelerating = false;
        this.currentSpeed = 0;
        this.setMotorSpeed(0);
        console.log("卡车停止！");
    }

    /**
  * 碰撞检测
  */
    onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        console.log("🔥 碰撞发生了！", selfCollider.node.name, "碰撞对象：", otherCollider.node.name);

        // if (contact) {
        //     const manifold = contact.getWorldManifold();
        //     console.log("🌍 碰撞点：", manifold.points);
        // }
    
        if (otherCollider.node.name === 'FinalFlag') {
            console.log("🚀 撞到旗子了，游戏成功！");
            alert("挑战成功！");
        }
    }

    update(dt: number) {
        if (this.isAccelerating) {
            this.currentSpeed += this.acceleration * dt;
            if (this.currentSpeed > this.maxSpeed) {
                this.currentSpeed = this.maxSpeed;
            }
            this.setMotorSpeed(this.currentSpeed);
        }
    }
}