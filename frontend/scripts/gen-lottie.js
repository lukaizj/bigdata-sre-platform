#!/usr/bin/env node
/**
 * 生成 3 个卡通角色的 Lottie JSON 动画文件
 * 每个角色：圆润矩形身体 + 白色眼睛 + 小脚 + 上下漂浮动画（72帧@24fps=3秒循环）
 */
const fs = require('fs');
const path = require('path');

function makeCharacter({ name, bodyColor, footColor, scaleY = 1 }) {
  const bodyH = Math.round(130 * scaleY);
  const bodyY = 90 + (bodyH - 130) / 2;
  const eyeY = -Math.round(bodyH * 0.12);
  const footY = bodyY + bodyH / 2 + 8;

  const bobUp = [80, bodyY - 10, 0];
  const bobMid = [80, bodyY, 0];
  const footUp = [80, footY - 6, 0];
  const footMid = [80, footY, 0];

  const easing = { x: [0.42, 0.58], y: [0, 1] };

  function posKeyframes(mid, up) {
    return {
      a: 1,
      k: [
        { i: { x: easing.x[0], y: easing.y[0] }, o: { x: easing.x[1], y: easing.y[1] }, t: 0, s: mid },
        { i: { x: easing.x[0], y: easing.y[0] }, o: { x: easing.x[1], y: easing.y[1] }, t: 36, s: up },
        { t: 72, s: mid }
      ]
    };
  }

  function shapeLayer(nm, ind, pos, shapes) {
    return {
      ddd: 0, ind, ty: 4, nm,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
        p: pos,
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0, shapes, ip: 0, op: 72, st: 0, bm: 0
    };
  }

  function fill(c) {
    return { ty: 'fl', c: { a: 0, k: c }, o: { a: 0, k: 100 }, r: 1, nm: 'fill' };
  }

  function tr() {
    return { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } };
  }

  const hexToLottie = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
  };

  const bodyLayer = shapeLayer('body', 1, posKeyframes(bobMid, bobUp), [
    {
      ty: 'gr', nm: 'body-shape', it: [
        { ty: 'rc', d: 1, s: { a: 0, k: [110, bodyH] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 52 }, nm: 'rect' },
        fill(hexToLottie(bodyColor)),
        tr()
      ]
    },
    {
      ty: 'gr', nm: 'leye', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [18, 18] }, p: { a: 0, k: [-18, eyeY] }, nm: 'e' },
        fill([1, 1, 1, 1]), tr()
      ]
    },
    {
      ty: 'gr', nm: 'lpupil', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [9, 9] }, p: { a: 0, k: [-18, eyeY] }, nm: 'p' },
        fill([0.1, 0.1, 0.1, 1]), tr()
      ]
    },
    {
      ty: 'gr', nm: 'reye', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [18, 18] }, p: { a: 0, k: [18, eyeY] }, nm: 'e' },
        fill([1, 1, 1, 1]), tr()
      ]
    },
    {
      ty: 'gr', nm: 'rpupil', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [9, 9] }, p: { a: 0, k: [18, eyeY] }, nm: 'p' },
        fill([0.1, 0.1, 0.1, 1]), tr()
      ]
    }
  ]);

  const feetLayer = shapeLayer('feet', 2, posKeyframes(footMid, footUp), [
    {
      ty: 'gr', nm: 'lfoot', it: [
        { ty: 'rc', d: 1, s: { a: 0, k: [24, 14] }, p: { a: 0, k: [-20, 0] }, r: { a: 0, k: 7 }, nm: 'f' },
        fill(hexToLottie(footColor)), tr()
      ]
    },
    {
      ty: 'gr', nm: 'rfoot', it: [
        { ty: 'rc', d: 1, s: { a: 0, k: [24, 14] }, p: { a: 0, k: [20, 0] }, r: { a: 0, k: 7 }, nm: 'f' },
        fill(hexToLottie(footColor)), tr()
      ]
    }
  ]);

  return {
    v: '5.7.4', fr: 24, ip: 0, op: 72, w: 160, h: 200,
    nm: name, ddd: 0, assets: [],
    layers: [bodyLayer, feetLayer]
  };
}

const outDir = path.join(__dirname, '../public/lottie');
fs.mkdirSync(outDir, { recursive: true });

const chars = [
  { file: 'char1.json', name: 'blob-orange', bodyColor: '#FF6B47', footColor: '#E85A38', scaleY: 0.92 },
  { file: 'char2.json', name: 'blob-purple', bodyColor: '#7C3AED', footColor: '#6027C8', scaleY: 1.25 },
  { file: 'char3.json', name: 'blob-yellow', bodyColor: '#EAB308', footColor: '#CA9A06', scaleY: 1.05 },
];

for (const { file, ...opts } of chars) {
  const json = makeCharacter(opts);
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(json));
  console.log(`Generated ${file}`);
}
console.log('Done.');
