class Stem {
  constructor(stemColor, swayOffset) {
    this.stemColor = stemColor;
    this.swayOffset = swayOffset;
  }

  getPointAt(t, state, currentHeight, bloomProgress = 1) {
    const easedBloom =
      bloomProgress * bloomProgress * (3 - 2 * bloomProgress);

    const motionAmount =
      state === "bloom"
        ? easedBloom
        : state === "alive"
        ? 1
        : state === "dying"
        ? 0.45
        : 0;

    const swaySpeed =
      state === "dying"
        ? 0.05
        : 0.03;

    const selfSway =
      sin(frameCount * swaySpeed + this.swayOffset) * 5 * motionAmount;

    const y = -currentHeight * t;
    const fallTilt = state === "dying" ? t * 18 : 0;

    const windEffect = globalWind * t * 0.18 * max(0.25, motionAmount);

    const x = sin(t * 2) * selfSway * 0.9 + fallTilt + windEffect;

    return { x, y, z: 0 };
  }

  display(state, currentHeight, bloomProgress = 1)  {
    if (state === "seed") return;

    push();
    noFill();
    stroke(this.stemColor);
    strokeWeight(2.5);

    beginShape();
    const segments = 4;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = this.getPointAt(t, state, currentHeight, bloomProgress);
      curveVertex(p.x, p.y, p.z);
    }

    endShape();

    if (state === "bloom" || state === "alive" || state === "dying") {
      const leaf1T = 0.32;
      const leaf2T = 0.52;

      const easedBloom =
        bloomProgress * bloomProgress * (3 - 2 * bloomProgress);

      // La primera hoja aparece antes.
      // La segunda aparece un poco después y más arriba.
      const leaf1Growth =
        state === "bloom"
          ? constrain(map(easedBloom, 0.15, 0.65, 0, 1), 0, 1)
          : 1;

      const leaf2Growth =
        state === "bloom"
          ? constrain(map(easedBloom, 0.38, 0.9, 0, 1), 0, 1)
          : 1;

      if (leaf1Growth > 0) {
        const leaf1 = this.getPointAt(leaf1T, state, currentHeight, bloomProgress);
        this.drawLeaf(leaf1.x, leaf1.y, leaf1.z, -1, 0.85, leaf1Growth);
      }

      if (leaf2Growth > 0) {
        const leaf2 = this.getPointAt(leaf2T, state, currentHeight, bloomProgress);
        this.drawLeaf(leaf2.x, leaf2.y, leaf2.z, 1, 0.65, leaf2Growth);
      }
    }
    pop();
  }

  drawLeaf(x, y, z, side = 1, size = 1, growth = 1) {
    push();
    translate(x, y, z);

    rotateZ(side * 0.65);
    rotateY(side * 0.25);

    fill(
      red(this.stemColor) * 0.8,
      green(this.stemColor) * 0.9,
      blue(this.stemColor) * 0.8,
      220
    );
    noStroke();

    scale(size);

    const g = constrain(growth, 0, 1);

    beginShape();

    vertex(0, 0, 0);

    bezierVertex(
      side * 7 * g,
      -5 * g,
      side * 10 * g,
      -14 * g,
      side * 3 * g,
      -22 * g
    );

    bezierVertex(
      side * -1 * g,
      -14 * g,
      side * -2 * g,
      -5 * g,
      0,
      0
    );

    endShape(CLOSE);

    pop();
  }

}