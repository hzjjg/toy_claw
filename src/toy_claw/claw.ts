import * as Matter from 'matter-js';
import { clawTextureData } from './texture_data';
import { Container, Sprite } from 'pixi.js';
import { PixiApp } from './pixi_instance';
import { RigidBodyRender } from './rigid_body_render';
export class Claw {

    public static async create() {
        const claw = new Claw();
        await claw.init();
        return claw;
    }

    /** 爪子线顶部，爪子的线与爪子部分 */
    public container: Container;

    /** 爪子的爪子部分 */
    public clawSprite: Container;

    private clawTop: Sprite;

    private clawLine: Sprite;

    private clawLeftFoot: Sprite;

    private clawRightFoot: Sprite;

    private rigidBodyRender = RigidBodyRender.getInstance();

    /** precent/second */
    public speed: number = 150;

    private grabPercent: number;

    public clawBody: Matter.Composite;

    private clawHeaderBody: Matter.Body;

    private clawLeftFootBody: Matter.Body;
    private clawRightFootBody: Matter.Body;

    /** 是否启用物理效果的爪子 */
    private isPhySicsClaw: false;

    public get positionX(): number {
        return this.clawSprite.position.x;
    }

    public set positionX(v: number) {
        this.clawSprite.position.x = v;

        this.clawTop.position.x = v + 13;
        this.clawLine.position.x = v + 55;
    }

    public get positionY(): number {
        if (this.isPhySicsClaw) {
            return this.clawHeaderBody.position.y;
        } else {
            return this.clawSprite.position.y;
        }
    }

    public set positionY(v: number) {
        if (this.isPhySicsClaw) {
            Matter.Body.setPosition(this.clawHeaderBody, { x: this.clawHeaderBody.position.x, y: v });
        } else {
            this.clawSprite.position.y = v;
        }

        this.clawLine.position.y = v;
        this.clawLine.height = -v + 42;
    }

    private loadTexture() {
        const urls: string[] = [];
        for (const key in clawTextureData) {
            if (clawTextureData.hasOwnProperty(key)) {
                const element = (<any> clawTextureData)[key];
                urls.push(element);
            }
        }
        return new Promise((resolve) => {
            PIXI.loader.add(urls).load((loader: any, resources: any) => {
                resolve(resources);
            });
        });
    }

    public async init() {
        await this.loadTexture();

        const clawContainer = this.container = new Container();

        /** 渲染左边爪子 */
        const claw = this.clawSprite = new Container();

        clawContainer.addChild(claw);

        this.clawRightFoot = new PIXI.Sprite(PIXI.loader.resources[clawTextureData.clawFoot].texture);
        this.clawRightFoot.position.set(76, 18);
        this.clawRightFoot.anchor.set(-0.05, 0.02);
        claw.addChild(this.clawRightFoot);

        /** 渲染右边爪子 */
        const clawLeftGroup = new PIXI.display.Group(10, true);
        PixiApp.stage.addChild(new PIXI.display.Layer(clawLeftGroup));
        this.clawLeftFoot = new PIXI.Sprite(PIXI.loader.resources[clawTextureData.clawFoot].texture);
        this.clawLeftFoot.position.set(56, 18);
        this.clawLeftFoot.anchor.set(-0.05, 0.02);
        this.clawLeftFoot.scale.x = -1;
        this.clawLeftFoot.parentGroup = clawLeftGroup;
        claw.addChild(this.clawLeftFoot);

        /** 渲染爪子顶部 */
        const clawHeaderGroup = new PIXI.display.Group(11, true);
        PixiApp.stage.addChild(new PIXI.display.Layer(clawHeaderGroup));
        const clawHeader = new PIXI.Sprite(PIXI.loader.resources[clawTextureData.clawHeader].texture);
        clawHeader.position.set(25, 0);
        clawHeader.parentGroup = clawHeaderGroup;
        claw.addChild(clawHeader);

        /** 渲染绳子上部 */
        this.clawTop = new PIXI.Sprite(PIXI.loader.resources[clawTextureData.clawTop].texture);
        this.clawTop.position.y = 0;
        clawContainer.addChild(this.clawTop);

        /** 渲染绳子 */
        const lineTexture = PIXI.loader.resources[clawTextureData.clawLine].texture;
        this.clawLine = new PIXI.extras.TilingSprite(lineTexture, 26, 26);
        this.clawLine.position.y = 42;
        clawContainer.addChild(this.clawLine);

        this.setGrabPrecent(60);

        // TODO 替换成物理效果的爪子
        this.isPhySicsClaw && this.buildClawBody();
    }

    private buildClawBody() {
        const x = 246;
        const y = 20;

        this.clawBody = Matter.Composite.create();

        this.clawHeaderBody = Matter.Bodies.rectangle(x, y, 90, 30, {
            isStatic: true,
        });

        const leftClawVertices = [
            { x: 0, y: 0 },
            { x: 30, y: 0 },
            { x: -10, y: 50 },
            { x: 0, y: 100 },
            { x: -10, y: 100 },
            { x: -30, y: 50 },
        ];

        const clawPartLeft = this.clawLeftFootBody = Matter.Bodies.fromVertices(x - 30, y + 50, <any> leftClawVertices, {
            mass: 1,
            label: 'claw',
        });

        const rightClawVertices = [
            { x: 0, y: 0 },
            { x: 30, y: 0 },
            { x: 60, y: 50 },
            { x: 30, y: 100 },
            { x: 20, y: 100 },
            { x: 40, y: 50 },
        ];

        const clawPartRight = this.clawRightFootBody = Matter.Bodies.fromVertices(x + 30, y + 50, <any> rightClawVertices, {
            mass: 1,
            label: 'claw',
        });

        const topToClawLeft = Matter.Constraint.create({
            bodyA: clawPartLeft,
            bodyB: this.clawHeaderBody,
            pointA: {
                x: 10,
                y: -35,
            },
            pointB: {
                x: -30,
                y: 0,
            },
            stiffness: 0.6,

        });

        const topToClawRight = Matter.Constraint.create({
            bodyA: clawPartRight,
            bodyB: this.clawHeaderBody,
            pointA: {
                x: -10,
                y: -35,
            },
            pointB: {
                x: 30,
                y: 0,
            },
            stiffness: 0.6,

        });

        Matter.Composite.add(this.clawBody, clawPartLeft);
        Matter.Composite.add(this.clawBody, clawPartRight);
        Matter.Composite.add(this.clawBody, topToClawLeft);
        Matter.Composite.add(this.clawBody, topToClawRight);
        Matter.Composite.add(this.clawBody, this.clawHeaderBody);

        this.rigidBodyRender.addBody(this.clawBody);
        this.renderClaw();

    }

    private renderClaw() {
        PixiApp.ticker.add(() => {
            this.clawLeftFoot.rotation = this.clawLeftFootBody.angle;
            this.clawRightFoot.rotation = this.clawRightFootBody.angle;
            this.clawLeftFoot.position.set(this.clawLeftFootBody.position.x - 130, this.clawLeftFootBody.position.y - 30);
            this.clawRightFoot.position.set(this.clawRightFootBody.position.x - 220, this.clawRightFootBody.position.y - 30);
        });
    }

    /**
     * 控制爪子抓取
     * @param precent 0 完全打开 - 100 完全抓紧
     */
    public grabTo(precent: number) {
        const fpsTime = 1000 / 60;
        return new Promise((resolve) => {
            const ticker = (delta: number) => {
                const offset = this.grabPercent - precent;
                const diff = this.speed / 1000 * (fpsTime + delta);
                const target = offset > 0 ? this.grabPercent - diff : this.grabPercent + diff;

                this.setGrabPrecent(target);

                if (Math.abs(this.grabPercent - precent) <= diff) {
                    this.setGrabPrecent(precent);
                    PixiApp.ticker.remove(ticker);
                    resolve();
                }
            };

            PixiApp.ticker.add(ticker);
        });

    }

    /**
     * 将爪子移动到指定位置
     * @param position 位置
     * @param time 花费的时间 ms
     */
    public tweenTo(position: { x?: number, y?: number }, time = 2000): Promise<any> {
        const x = position.x !== undefined ? position.x : this.positionX;
        const y = position.y !== undefined ? position.y : this.positionY;
        const speedX = (x - this.positionX) / time * 1000 / 60;
        const speedY = (y - this.positionY) / time * 1000 / 60;

        return new Promise(resolve => {
            const ticker = (delta: number) => {
                this.positionX += speedX;
                this.positionY += speedY;

                if (Math.abs(this.positionX - x) <= Math.abs(speedX) && Math.abs(this.positionY - y) <= Math.abs(speedY)) {
                    this.positionX = x;
                    this.positionY = y;
                    PixiApp.ticker.remove(ticker);
                    resolve();
                }
            };

            PixiApp.ticker.add(ticker);
        });
    }

    /**
     * 设置爪子抓紧的程度
     * @param precent 抓紧的百分比 0:放松 100:抓紧
     */
    public setGrabPrecent(precent: number) {
        this.grabPercent = precent;

        // 幅度 -0.5 - 0.5
        const rotation = (precent - 50) / 100;

        if (this.isPhySicsClaw) {
            if (this.clawBody) {
                const hasClawCollision = this.rigidBodyRender.engine.pairs.list.some((item: any) => {
                    return item.bodyA.label === 'claw' || item.bodyB.label === 'claw';
                });

                if (hasClawCollision) {
                    // this.clawPartLeft.torque = -0.1;
                    // this.clawPartRight.torque = 0.1;
                }
                // Matter.Body.setAngle(this.clawPartLeft, -rotation);
                // Matter.Body.setAngle(this.clawPartRight, rotation);
            }
        } else {
            this.clawLeftFoot.rotation = -rotation;
            this.clawRightFoot.rotation = rotation;
        }
    }
}