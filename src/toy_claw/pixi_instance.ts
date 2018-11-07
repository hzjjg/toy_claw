import * as PIXI from 'pixi.js';
import 'pixi-layers';

export const PixiApp = new PIXI.Application({
    width: 750,
    height: 1198,
    antialias: true,
    transparent: false,
    resolution: 1,
});

const stage =  PixiApp.stage = new PIXI.display.Stage();
stage.group.enableSort = true;
