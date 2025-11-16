import { _decorator, Component, Node, instantiate, Vec3, Prefab, BoxCollider2D, IPhysics2DContact, view, ResolutionPolicy, director } from 'cc';
import { DrawBridge } from './DrawBridge';
import { TruckControl } from './Truck';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Node)
    drawNode: Node = null; // 画桥的节点

    @property(Node)
    truck: Node = null; // 当前的卡车节点

    @property(Prefab)
    truckPrefab: Node = null; // 卡车的预制体

    onLoad() {
        view.setDesignResolutionSize(720, 1280, ResolutionPolicy.SHOW_ALL);
    }

    start() {
    }

    update(deltaTime: number) {
        // 每帧更新逻辑
    }

    TruckStart() {
        this.truck.getComponent(TruckControl).startMoving();
    }

    Restart() {
        // 清除桥梁
        if (this.drawNode) {
            this.drawNode.getComponent(DrawBridge).clearPhysicalBridge();
        }

        // 删除当前的卡车节点
        if (this.truck) {
            this.truck.destroy();
            this.truck = null; // 清空引用
        }

        // 创建新的卡车节点
        if (this.truckPrefab) {
            const newTruck = instantiate(this.truckPrefab); // 实例化预制体
            newTruck.setPosition(new Vec3(-283.524, 94.777, 0)); // 设置位置

            this.node.addChild(newTruck); // 添加到场景中

            this.truck = newTruck; // 更新引用
        } else {
            console.error("Truck 预制体未设置！");
        }
    }

    NextLevel() {
        director.loadScene('game-level2');
    }

    BackLevel() {
        director.loadScene('game');
    }
}