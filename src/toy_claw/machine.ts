import { Claw } from './claw';
import { PixiApp } from './pixi_instance';
import { MachineTextureData } from './texture_data';
import { Sprite, Container, Texture, Graphics } from 'pixi.js';

export class Machine {

    private slogen: Sprite;
    private bottomLight: Sprite;
    private verticalLightLeft: Sprite;
    private verticalLightRight: Sprite;

    claw: Claw;
    conveyor: PIXI.extras.TilingSprite;
    startBtn: Container;
    machineBoxMask: Graphics;

    /** 娃娃机的内部区域 */
    machineBox: Container;

    public async init() {
        await this.render();
    }

    /**
     * 渲染娃娃机
     */
    private async render() {
        await this.loadTexture();

        this.renderBg();
        this.renderSlogen();
        this.renderBtn();
        this.renderVerticalLight();
        this.renderBottomLight();

        this.renderMachineBox();
        this.renderConveryor();
        this.startLightBlink();

        await this.renderClaw();
    }

    /**
     * 加载所需材质
     */
    private loadTexture() {
        const urls: string[] = [];
        for (const key in MachineTextureData) {
            if (MachineTextureData.hasOwnProperty(key)) {
                const element = (<any> MachineTextureData)[key];
                urls.push(element);
            }
        }
        return new Promise((resolve) => {
            PIXI.loader.add(urls).load((loader: any, resources: any) => {
                resolve(resources);
            });
        });
    }

    /**
     * 渲染娃娃机箱子内部分
     */
    private renderMachineBox() {
        const box = this.machineBox = new Container();
        const mask = this.machineBoxMask = new PIXI.Graphics();
        box.position.set(119, 300);
        box.addChild(mask);
        box.mask = mask;
        mask.drawRect(0, 0, 510, 635);
        PixiApp.stage.addChild(this.machineBox);

    }

    /**
     * 渲染娃娃机背景
     */
    private renderBg() {
        const texture = this.getTexture(MachineTextureData.machineBg);
        const bg = new PIXI.Sprite(texture);
        bg.width = PixiApp.renderer.width;
        bg.height = PixiApp.renderer.height;
        PixiApp.stage.addChild(bg);
    }

    /**
     * 渲染标语
     */
    private renderSlogen() {
        const texture = this.getTexture(MachineTextureData.slogen);
        this.slogen = new PIXI.Sprite(texture);
        this.slogen.position.set(46, 20);
        PixiApp.stage.addChild(this.slogen);
    }

    /**
     * 渲染按钮
     */
    private renderBtn() {
        const btnBgTexture = this.getTexture(MachineTextureData.startBtnBg);
        const btnTexture = this.getTexture(MachineTextureData.startBtn);
        const btnContainer = new Container();
        const btnBg = new Sprite(btnBgTexture);
        const btn = this.startBtn = new Sprite(btnTexture);

        btnBg.position.set(0, 0);
        btn.anchor.set(0.5, 0.5);
        btn.position.set(178, 78);
        btn.interactive = true;
        btnContainer.position.set(200, 960);
        btnContainer.addChild(btnBg).addChild(btn);
        PixiApp.stage.addChild(btnContainer);

        // 点击按钮效果
        this.startBtn.addListener('pointerdown', () => {
            this.startBtn.scale.set(0.95, 0.95);
            this.startBtn.position.set(178, 82);
        });

        // 释放按钮效果
        this.startBtn.addListener('pointerup', () => {
            this.startBtn.position.set(178, 78);
            this.startBtn.scale.set(1, 1);
        });
    }

    /**
     * 渲染左右两边灯光
     */
    private renderVerticalLight() {
        const texture = this.getTexture(MachineTextureData.lightVertical);
        this.verticalLightLeft = new Sprite(texture);
        this.verticalLightRight = new Sprite(texture);

        this.verticalLightLeft.position.set(20, 30);
        this.verticalLightRight.position.set(666, 0);

        PixiApp.stage.addChild(this.verticalLightLeft).addChild(this.verticalLightRight);
    }

    /**
     * 渲染底部灯光
     */
    private renderBottomLight() {
        const texture = this.getTexture(MachineTextureData.lightBottom);
        this.bottomLight = new PIXI.Sprite(texture);
        this.bottomLight.position.set(0, 1090);
        PixiApp.stage.addChild(this.bottomLight);
    }

    /**
     * 渲染传送带
     */
    private renderConveryor() {
        const texture = this.getTexture(MachineTextureData.conveyor);
        const conveyor = this.conveyor = new PIXI.extras.TilingSprite(texture, 534, 141);
        conveyor.position.set(0, 496);
        this.machineBox.addChild(conveyor);
    }

    /**
     * 灯光闪烁
     */
    private startLightBlink(){
        let status: 1|2 = 1;
        setInterval(() => {
            let verticalTexture: Texture;
            let bottomTexture: Texture;

            if (status === 1){
                 verticalTexture = this.getTexture(MachineTextureData.lightVerticalChange);
                 bottomTexture = this.getTexture(MachineTextureData.lightBottomLighter);
            }else{
                 verticalTexture = this.getTexture(MachineTextureData.lightVertical);
                 bottomTexture = this.getTexture(MachineTextureData.lightBottom);
            }

            this.verticalLightRight.texture = verticalTexture;
            this.verticalLightLeft.texture = verticalTexture;
            this.bottomLight.texture = bottomTexture;
            status = (status === 1 ? 2 : 1);
        }, 500);
    }

    /**
     * 渲染爪子
     */
    private async renderClaw() {
        const claw = await Claw.create();
        this.claw = claw;
        claw.positionX = 180;
        claw.positionY = 64;
        this.machineBox.addChild(claw.container);
    }

    /**
     * 获取已经加载好的材质
     * @param name 材质名称
     */
    private getTexture(name: string) {
        return PIXI.loader.resources[name].texture;
    }

}