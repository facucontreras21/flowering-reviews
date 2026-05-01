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
    const x = sin(t * 2) * selfSway * 0.9 + fallTilt + windEffect;

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

    if (state === "alive" || state === "dying") {
      const leaf1T = 0.32;
      const leaf2T = 0.52;

      const leaf1Growth = constrain(map(currentHeight, 18, 42, 0, 1), 0, 1);
      const leaf2Growth = constrain(map(currentHeight, 38, 70, 0, 1), 0, 1);

      if (leaf1Growth > 0) {
        const leaf1 = this.getPointAt(leaf1T, state, currentHeight);
        this.drawLeaf(leaf1.x, leaf1.y, leaf1.z, -1, 0.85, leaf1Growth);
      }

      if (leaf2Growth > 0) {
        const leaf2 = this.getPointAt(leaf2T, state, currentHeight);
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