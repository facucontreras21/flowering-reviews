class FlowerCluster {
  constructor(flowerCount, flowerColors) {
    this.flowerCount = flowerCount;
    this.flowerColors = flowerColors;
    this.branchOffsets = this.buildBranchOffsets();
  }

  buildBranchOffsets() {
    const offsets = [];
    const sideCount = max(0, this.flowerCount - 1);

    if (sideCount === 0) return offsets;

    for (let i = 0; i < sideCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;

      offsets.push({
        side,
        bendX: random(2, 6) * side,
        bendZ: random(-3, 3),
        lift: random(6, 10),
      });
    }

    return offsets;
  }

  display(state, currentHeight, stem, alpha = 255, bloomProgress = 1) {
    if (!["bloom", "alive", "dying"].includes(state)) return;

    // Main flower at the top of the stem.
    const topPoint = stem.getPointAt(1, state, currentHeight, bloomProgress);

    push();
    translate(topPoint.x, topPoint.y, topPoint.z);
    rotateZ(topPoint.x * 0.015);

    const flowerYOffset = state === "dying" ? 10 : 15;
    translate(0, flowerYOffset, 6);

    this.drawFlowerHead(this.flowerColors[0], alpha, bloomProgress);
    pop();

    if (this.flowerCount === 1) return;

    // Side flowers grow from short branches near the upper half of the stem.
    const sideFlowerCount = this.flowerCount - 1;

    for (let i = 0; i < sideFlowerCount; i++) {
      const offset = this.branchOffsets[i];

      const t =
        sideFlowerCount === 1
          ? 0.72
          : map(i, 0, sideFlowerCount - 1, 0.82, 0.5);

      const stemPoint = stem.getPointAt(t, state, currentHeight, bloomProgress);

      push();
      translate(stemPoint.x, stemPoint.y, stemPoint.z);
      rotateZ(stemPoint.x * 0.015);

      stroke(
        red(stem.stemColor),
        green(stem.stemColor),
        blue(stem.stemColor),
        220
      );
      strokeWeight(2.2);

      line(0, 0, 0, offset.bendX, -offset.lift, offset.bendZ);

      translate(offset.bendX, -offset.lift, offset.bendZ);
      translate(0, 4, 6);

      this.drawFlowerHead(
        this.flowerColors[(i + 1) % this.flowerColors.length],
        alpha,
        bloomProgress
      );

      pop();
    }
  }

  drawFlowerHead(petalColor, alpha = 255, bloomProgress = 1) {
    push();
    noStroke();

    const petalCount = 8;
    const radius = 5.2;

    // Outer petals appear one by one in a circular sequence.
    for (let i = 0; i < petalCount; i++) {
      const angle = (TWO_PI / petalCount) * i;

      push();
      rotateZ(angle);
      translate(0, -radius, 0);

      const petalDelay = i / petalCount;
      const petalProgress = constrain(
        (bloomProgress - petalDelay * 0.65) / 0.35,
        0,
        1
      );
      const easedPetal = petalProgress * petalProgress * (3 - 2 * petalProgress);

      fill(
        red(petalColor),
        green(petalColor),
        blue(petalColor),
        min(235, alpha) * easedPetal
      );

      scale(0.75 * easedPetal, 1.35 * easedPetal, 0.25);
      ellipsoid(3, 3.8, 1.2);
      pop();
    }

    // Smaller inner petals appear slightly after the outer ring.
    for (let i = 0; i < petalCount; i++) {
      const angle = (TWO_PI / petalCount) * i + PI / petalCount;

      push();
      rotateZ(angle);
      translate(0, -3.1, 0);

      const petalDelay = i / petalCount;
      const petalProgress = constrain(
        (bloomProgress - petalDelay * 0.65 - 0.15) / 0.35,
        0,
        1
      );
      const easedPetal = petalProgress * petalProgress * (3 - 2 * petalProgress);

      fill(
        red(petalColor) * 0.9,
        green(petalColor) * 0.9,
        blue(petalColor) * 0.9,
        min(230, alpha) * easedPetal
      );

      scale(0.55 * easedPetal, 1.0 * easedPetal, 0.22);
      ellipsoid(2.4, 3.2, 1);
      pop();
    }

    // The center appears after most petals have opened.
    const centerProgress = constrain((bloomProgress - 0.65) / 0.35, 0, 1);
    const easedCenter = centerProgress * centerProgress * (3 - 2 * centerProgress);

    fill(245, 230, 130, alpha * easedCenter);
    scale(easedCenter);
    ellipsoid(2.8, 2.8, 0.8);

    pop();
  }
}
