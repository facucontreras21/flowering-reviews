class Stem {
  constructor(stemColor, swayOffset) {
    this.stemColor = stemColor;
    this.swayOffset = swayOffset;
  }

  getPointAt(t, state, currentHeight) {
    const selfSway =
      state === "alive"
        ? sin(frameCount * 0.03 + this.swayOffset) * 5
        : state === "dying"
        ? sin(frameCount * 0.05 + this.swayOffset) * 3
        : 0;

    const y = -currentHeight * t;
    const fallTilt = state === "dying" ? t * 18 : 0;
    const windEffect = globalWind * t * 0.18;
    const x = sin(t * PI) * selfSway * 0.25 + fallTilt + windEffect;

    return { x, y, z: 0 };
  }

  display(state, currentHeight) {
    if (state === "seed") return;

    push();
    noFill();
    stroke(this.stemColor);
    strokeWeight(2.5);

    beginShape();
    const segments = 16;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = this.getPointAt(t, state, currentHeight);
      curveVertex(p.x, p.y, p.z);
    }

    endShape();
    pop();
  }
}