import * as Matter from 'matter-js';
import { PixiApp } from './pixi_instance';
import { RigidBody } from './rigid_body';

export class RigidBodyRender {

    public static getInstance() {

        if (!this.instance) {
            this.instance = new RigidBodyRender();

        }
        return this.instance;
    }

    private static instance: RigidBodyRender;

    public engine: Matter.Engine;

    public set debugMode(v: boolean) {
        if (v){
            this.showDebugRender();
        }
    }

    ground: Matter.Body;

    rigidBodies: RigidBody[] = [];

    private constructor(config?: {
        debugMode?: boolean,
    }) {

        RigidBodyRender.instance = this;
        this.engine = Matter.Engine.create();

        // 增加地板
        this.ground = Matter.Bodies.rectangle(750 - 119, 625, 750 * 2, 100, { isStatic: true , label: 'ground'});
        Matter.World.add(this.engine.world, this.ground);
    }

    /** 用于开发查看刚体的数据 */
    showDebugRender() {
        const config = {
            width: 750,
            height: 1198,
            hasBounds: true,
            showVelocity: true,
            showAngleIndicator: true,
        };

        const render = Matter.Render.create({
            element: document.body,
            engine: this.engine,
            options: config,
        });

        Matter.Bounds.translate(render.bounds, {
            x: -119,
            y: -300,
        });

        render.canvas.style.width = `${screen.width}px`;
        render.canvas.style.position = 'fixed';
        render.canvas.style.top = '0';
        render.canvas.style.left = '0';
        render.canvas.style.zIndex = '9999';
        render.canvas.style.pointerEvents = 'none';
        setTimeout(() => {
            render.canvas.style.background = 'rgba(0,0,0,0)';
        }, 100);

        Matter.Render.run(render);
    }

    run() {
        Matter.Engine.run(this.engine);
        PixiApp.ticker.add((delta) => {
            this.runLoop(delta);
        });
    }

    clearEngine() {
        Matter.Engine.clear(this.engine);
    }

    addBody(body: Matter.Body | Matter.Constraint |Matter.Composite) {
        Matter.World.add(this.engine.world, body);
    }

    removeBody(body: Matter.Body) {
        Matter.World.remove(this.engine.world, body);
    }

    addRigidBody(rigidBody: RigidBody) {
        this.rigidBodies.push(rigidBody);
        this.addBody(rigidBody.body);
    }

    removeRigidBody(rigidBody: RigidBody) {
        this.rigidBodies.splice(this.rigidBodies.indexOf(rigidBody), 1);
        this.removeBody(rigidBody.body);
    }

    private runLoop(delta: number) {
        this.rigidBodies.forEach(item => {
            item.loopFunction();
        });
    }
}
