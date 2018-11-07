import * as Matter from 'matter-js';
import { Sprite } from 'pixi.js';
import { RigidBodyRender } from './rigid_body_render';

export class RigidBody{

    /** 刚体 */
    public body: Matter.Body;

    /** 刚体的渲染 */
    public sprite: Sprite;

    /** 用于识别 */
    public id: string;

    public static create(sprite: Sprite, body?: Matter.Body, options?: any){
        const rigidBody =  new RigidBody(sprite, body, options || {});
        const render = RigidBodyRender.getInstance();
        render.addRigidBody(rigidBody);
        return rigidBody;
    }

    private constructor(sprite: Sprite, body: Matter.Body, options?: any){
        let _body = body;

        if (!_body){
            _body = Matter.Bodies.rectangle(sprite.x, sprite.y, sprite.texture.width, sprite.texture.height);
        }

        this.sprite = sprite;
        this.body = _body;

        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
    }

    public setPosition(x: number, y: number){
        Matter.Body.setPosition(this.body, {x, y});
        Matter.Body.setVelocity(this.body, {x: 0, y: 0});
    }

    public loopFunction() {
        this.sprite.position.set(this.body.position.x, this.body.position.y);
        this.sprite.rotation = this.body.angle;
    }
}