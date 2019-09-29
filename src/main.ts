import { PixiApp } from './toy_claw/pixi_instance';
import { ToyClaw } from './toy_claw';
import './scss/index.scss';

document.body.appendChild(PixiApp.view);

PixiApp.view.style.width = `375px`;

/** 奖品的顶点信息 */
const vertices = [
    { x: -65, y: -80 },
    { x: -45, y: -115 },
    { x: -30, y: -120 },
    { x: 0, y: -130 },
    { x: 30, y: -120 },
    { x: 45, y: -115 },
    { x: 65, y: -80 },
    { x: 60, y: 60 },
    { x: -60, y: 60 },
];

const toyClaw = new ToyClaw({
    onCatchPrize: (prizeId) => {
        toyClaw.releasePrizeAt(20);
        console.log(prizeId);
    },
    onStartPlay: async () => {
        console.log('start');
        return true;
    },
    onMissPrize: () => {
        console.log('miss');
    },
    prizes: [
        {
            id: '1',
            imgUrl: require('./assets/5bdc18849a8b79576.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdc1b3939e30473.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdc1edce2fcd6877.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdc22b7b67cb4215.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdfbad6e4bdf6611.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdfe7e731aed1460.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdbdf8f657227641.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdbdf8307a1c7003.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdbdfb2484558276.png'),
            vertices,
        },
        {
            id: '',
            imgUrl: require('./assets/5bdbe018a531b5259.png'),
            vertices,
        },
    ],
    clawDownSpeed: 50,
    conveyorSpeed: 50,
    clawUpSpeed: 25,
    clawCatchSpeed: 50,
    catchDifficulty: 50,
});

toyClaw.boot();
