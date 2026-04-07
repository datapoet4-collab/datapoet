export type State = {
  figuration: number;
  volumetricDensity: number;
  instability: number;
  painterlySkin: number;
  motionAggression: number;
};

export function getRenderParams(s: State) {
  return {
    colorShift: [
      Math.floor(60 + s.painterlySkin * 180),
      Math.floor(120 + s.volumetricDensity * 120),
      Math.floor(240 - s.figuration * 120)
    ],
    noiseScale: 0.002 + s.instability * 0.01,
    particleCount: Math.floor(400 + s.volumetricDensity * 3000),
    velocity: 0.3 + s.motionAggression * 1.2,
    blur: 8 * (1 - s.figuration)
  };
}
