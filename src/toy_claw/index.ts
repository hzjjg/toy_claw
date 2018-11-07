import { PixiApp } from './pixi_instance';
import { Claw } from './claw';

/** matter js 的依赖 */
import * as decomp from 'poly-decomp';
(<any> window).decomp = decomp;

import * as Matter from 'matter-js';
import { RigidBodyRender } from './rigid_body_render';
import { Machine } from './machine';
import { RigidBody } from './rigid_body';

export class ToyClaw {

    public isClawRunning = false;

    private claw: Claw;

    private catchedPrize: RigidBody;

    private machine = new Machine();

    private prizeDisplayGroup = new PIXI.display.Group(0, true);

    private rigidBodyRender: RigidBodyRender;

    private config: ToyClawConfig;

    private randomFun: any;

    constructor(config: ToyClawConfig) {
        this.config = config;

        config.catchDifficulty = this.fix1To100(config.catchDifficulty);
        config.clawCatchSpeed = this.fix1To100(config.clawCatchSpeed);
        config.clawDownSpeed = this.fix1To100(config.clawDownSpeed);
        config.clawUpSpeed = this.fix1To100(config.clawUpSpeed);
        config.conveyorSpeed = this.fix1To100(config.conveyorSpeed);
    }

    public boot() {
        this.init();
    }

    /**
     * 修正数值为0-100之间，缺省为50
     * @param number 数值
     */
    private fix1To100(number: number) {
        isNaN(number) && (number = 50);
        return Math.min(Math.max(1, number), 100);
    }

    /**
     * 加载奖品材质
     */
    private loadPrizeTexture() {
        let urls = this.config.prizes.map(item => item.imgUrl);
        const unique = (a: any[]) => Array.from(new Set(a));
        urls = unique(urls);

        return new Promise((resolve) => {
            PIXI.loader.add(urls).load((loader: any, resources: any) => {
                resolve(resources);
            });
        });
    }

    /**
     * 开始游戏
     */
    private async startPlay() {

        if (this.config.onStartPlay) {
            const canPlay = await this.config.onStartPlay();
            if (!canPlay) return;
        }

        if (this.isClawRunning) return;
        this.isClawRunning = true;

        // 应用爪子抓取速度
        this.machine.claw.speed = this.config.clawCatchSpeed * 3;

        await this.claw.grabTo(10);
        await this.claw.tweenTo({ y: 330 }, 65000 / this.config.clawDownSpeed);
        await this.claw.grabTo(90);

        this.catchedPrize = this.rigidBodyRender.rigidBodies.find(item => {
            // TODO 难度可以在此调整 爪子抓时的容错
            const spriteWidth = this.claw.clawSprite.width;

            return Math.abs(
                item.sprite.position.x - (this.claw.positionX + spriteWidth / 2),
            )
                <= (spriteWidth - spriteWidth * this.config.catchDifficulty / 100) / 2;
        });

        // 触发抓起奖品事件
        if (this.catchedPrize) {
            this.config.onCatchPrize && this.config.onCatchPrize(this.catchedPrize.id);
        } else {
            this.config.onMissPrize && this.config.onMissPrize();
        }

        await this.claw.tweenTo({ y: 64 }, 65000 / this.config.clawUpSpeed);
        this.isClawRunning = false;

    }

    public releasePrizeNow() {
        this.catchedPrize = null;
    }

    /**
     * 奖品在某处之前放下
     * @param precent 奖品 中心点y坐标 相对于箱子内部位置的百分比。如果设置太小，达不到位置会导致无法放下
     */
    public releasePrizeAt(precent = 50) {
        const releaseTicker = () => {
            if (this.claw.positionY <= this.machine.machineBox.height * precent / 100) {
                this.releasePrizeNow();
                PixiApp.ticker.remove(releaseTicker);
            }
        };

        PixiApp.ticker.add(releaseTicker);
    }

    private initButton() {
        this.machine.startBtn.addListener('pointerdown', () => {
            this.startPlay();
        });

    }

    private rollPrizes() {
        const conveyorSpeed = this.config.conveyorSpeed / 50;  // px/fps
        const diff = conveyorSpeed;

        const conveyorX = this.machine.conveyor.tilePosition.x;

        if (conveyorX <= -this.machine.conveyor.texture.width) {
            this.machine.conveyor.tilePosition.x = 0;
            this.addPrizes(615);
        }

        this.machine.conveyor.tilePosition.x -= diff;

        // groud
        const groundBody = this.rigidBodyRender.ground;
        Matter.Body.setVelocity(groundBody, { x: -diff, y: 0 });
    }

    /**
     * 加权随机数算法
     * @param weights 权重
     */
    private randomInProbability(weights: number[]) {
        if (arguments.length > 1) {
            weights = [].slice.call(arguments);
        }

        let total, current = 0;
        let i = 0;
        const parts = [];
        const l = weights.length;

        total = weights.reduce((a, b) => {
            return a + b;
        });

        for (; i < l; i++) {
            current += weights[i];
            parts.push('if( p < ', current / total, ' ) return ', i / l, ' + n;');
        }

        return Function('var p = Math.random(), n = Math.random() / ' + l + ';' + parts.join(''));
    }

    /**
     * 增加三个奖品
     */
    private addPrizes(startX: number, prizeCount = 3) {

        this.randomFun = this.randomFun || this.randomInProbability(this.config.prizes.map(item => item.weight || 1));

        // 按权重随机选择商品
        const prizes: Prize[] = [];

        for (let i = 0; i < prizeCount; i++) {
            let index = Math.floor(this.randomFun() * this.config.prizes.length);

            // 避免同组有重复
            while (prizes.length > 0 && prizes.includes(this.config.prizes[index])) {
                index = Math.floor(this.randomFun() * this.config.prizes.length);
            }

            prizes.push(this.config.prizes[index]);
        }

        prizes.forEach((item, index) => {

            const prizeSprite = new PIXI.Sprite(PIXI.loader.resources[item.imgUrl].texture);

            prizeSprite.x = startX + 175 * (index);
            prizeSprite.y = 510;
            prizeSprite.mask = this.machine.machineBoxMask;
            prizeSprite.parentGroup = this.prizeDisplayGroup;

            this.machine.machineBox.addChild(prizeSprite);

            let body: Matter.Body;

            if (item.vertices) {
                body = Matter.Bodies.fromVertices(prizeSprite.x, prizeSprite.y, <any> item.vertices);
            } else {
                body = Matter.Bodies.rectangle(prizeSprite.x, prizeSprite.y, prizeSprite.texture.width, prizeSprite.texture.height);
            }

            body.frictionStatic = 1;
            body.friction = 1;

            const rigidBody = RigidBody.create(prizeSprite, body);
            rigidBody.id = item.id;
        });
    }

    private setup() {
        PixiApp.stage.addChild(new PIXI.display.Layer(this.prizeDisplayGroup));
        this.initPrizes();
        this.initButton();

        PixiApp.ticker.add(() => {
            this.gameLoop();
        });

        this.initPhysicsEngine();
    }

    /**
     * 让在爪子上的奖品消失
     */
    clearCatchedPrize() {
        this.rigidBodyRender.removeRigidBody(this.catchedPrize);
        this.machine.machineBox.removeChild(this.catchedPrize.sprite);
        this.catchedPrize = null;
    }

    /**
     * 定时释放无用资源
     */
    private startPrizeGc() {
        setInterval(() => {
            this.rigidBodyRender.rigidBodies.forEach((item) => {
                if (item.sprite.position.x < -119) {
                    this.rigidBodyRender.removeRigidBody(item);
                    this.machine.machineBox.removeChild(item.sprite);
                }
            });

        }, 2000);
    }

    private initPhysicsEngine() {
        this.rigidBodyRender = RigidBodyRender.getInstance();
        this.rigidBodyRender.run();
        this.rigidBodyRender.debugMode = this.config.debugMode;

        this.startPrizeGc();
    }

    private gameLoop() {
        this.rollPrizes();

        // 同步抓起的奖品
        if (this.catchedPrize) {
            this.catchedPrize.setPosition(this.catchedPrize.body.position.x, this.claw.positionY + 140);
        }
    }

    private initPrizes() {
        this.addPrizes(82);
        this.addPrizes(615);
    }

    private async init() {
        await this.loadPrizeTexture();
        await this.machine.init();
        this.claw = this.machine.claw;
        this.setup();
    }
}

export interface ToyClawConfig {

    /** 奖品 */
    prizes: Prize[];

    /** 爪子下降速度 1-100 default:50  */
    clawDownSpeed?: number;

    /** 爪子上升速度 1-100 default:50  */
    clawUpSpeed?: number;

    /** 爪子抓取速度 1-100 default:50 */
    clawCatchSpeed?: number;

    /** 抓取难度，难度越大，抓取判定区域越小 1-100 default:50 */
    catchDifficulty?: number;

    /** 传送带移动速度 1-100 default:50  */
    conveyorSpeed?: number;

    /**
     * 抓取到奖品
     * @param prizeId 传入的奖品id
     */
    onCatchPrize?(prizeId: string): any;

    /**
     * 点击开始按钮 ,promise 返回 true 游戏才开始
     */
    onStartPlay?(): Promise<boolean>;

    /**
     * 没抓到奖品
     */
    onMissPrize?(): any;

    /** 调试模式，可以看到刚体形状 */
    debugMode?: boolean;
}

interface Prize {
    id: string;
    imgUrl: string;
    /** 权重 1-100 */
    weight?: number;
    /** 顶点信息 */
    vertices?: { x: number, y: number }[];
}