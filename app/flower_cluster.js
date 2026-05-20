class FlowerCluster {
  constructor(flowerCount, flowerColors) {
    this.flowerCount = flowerCount;
    this.flowerColors = flowerColors;
    this.petals = [];
    this.branchOffsets = this.buildBranchOffsets();
  }

  buildBranchOffsets() {
    const offsets = [];
    const sideCount = max(0, this.flowerCount - 1);

    if (sideCount === 0) return offsets;

    const minDropFromTop = this.stemHeight * 0.25; // un poco debajo de la punta
    const maxDropFromTop = this.stemHeight * 0.35;  // nunca más abajo que la mitad

    for (let i = 0; i < sideCount; i++) { 
      const side = i % 2 === 0 ? -1 : 1;

      // distribuye las ramas entre cerca de la punta y la mitad del tallo
      const t = sideCount === 1 ? 0.35 : i / (sideCount - 1);
      const dropFromTop = lerp(minDropFromTop, maxDropFromTop, t);

      offsets.push({
        side,
        attachY: -this.stemHeight + dropFromTop,
        bendX: random(2, 6) * side,
        bendZ: random(-3, 3),
        lift: random(6, 10),
      });
    }

    return offsets;
  }

  spawnPetals(currentHeight) {
    this.petals = [];

    for (let i = 0; i < this.flowerCount; i++) {
      const angle = map(i, 0, this.flowerCount, 0, TWO_PI);

      this.petals.push({
        x: cos(angle) * 10,
        y: -currentHeight,
        z: sin(angle) * 10,
        vx: random(0.2, 1.2),
        vy: random(-0.4, 0.1),
        vz: random(-0.8, 0.8),
        alpha: 255,
        color: this.flowerColors[i % this.flowerColors.length],
        phase: random(TWO_PI),
        sway: 0,
      });
    }
  }

  update(state) {
    if (state === "dying") {
      for (const petal of this.petals) {
        petal.x += petal.vx;
        petal.y += petal.vy;
        petal.z += petal.vz;
        petal.vx *= 0.99;
        petal.vz *= 0.99;
        petal.vy += 0.02;
        petal.alpha -= 3;
      }
    }

    if (state === "alive") {
      for (const petal of this.petals) {
        petal.sway = sin(frameCount * 0.025 + petal.phase) * 0.8;
      }
    }
  }

  display(state, currentHeight, stem, alpha = 255,  bloomProgress = 1) {
    if (!["bloom", "alive", "dying"].includes(state)) return;

    // ===== FLOR PRINCIPAL EN LA PUNTA =====
    const topPoint = stem.getPointAt(1, state, currentHeight, bloomProgress);

    push();
    translate(topPoint.x, topPoint.y, topPoint.z);
    rotateZ(topPoint.x * 0.015);

    // ajuste para que la base de la flor apoye en la punta
    const flowerYOffset = state === "dying" ? 10 : 15;

    translate(0, flowerYOffset, 6);

    this.drawGeranium(this.flowerColors[0], alpha, bloomProgress);
    pop();

    // si solo hay una flor, terminamos acá
    if (this.flowerCount === 1) return;

    // ===== FLORES LATERALES =====
    const sideFlowerCount = this.flowerCount - 1;

    for (let i = 0; i < sideFlowerCount; i++) {
      const offset = this.branchOffsets[i];

      // nacen cerca de la punta, pero más abajo
      const t =
        sideFlowerCount === 1
          ? 0.72
          : map(i, 0, sideFlowerCount - 1, 0.82, 0.5);

      const stemPoint = stem.getPointAt(t, state, currentHeight, bloomProgress);

      push();
      translate(stemPoint.x, stemPoint.y, stemPoint.z);

      // inclinación acompañando el movimiento del tallo
      rotateZ(stemPoint.x * 0.015);

      // mismo color que el tallo principal
      stroke(
        red(stem.stemColor),
        green(stem.stemColor),
        blue(stem.stemColor),
        220
      );
      strokeWeight(2.2);

      // tallito lateral corto
      line(0, 0, 0, offset.bendX, -offset.lift, offset.bendZ);

      translate(offset.bendX, -offset.lift, offset.bendZ);

      translate(0, 4, 6);
      // que la base de la flor toque el final del tallito
      this.drawGeranium(
        this.flowerColors[(i + 1) % this.flowerColors.length],
        alpha,
        bloomProgress
      );

      pop();
    }
  }

  displayDetachedPetals() {
    noStroke();

    for (const petal of this.petals) {
      push();
      translate(petal.x, petal.y, petal.z);
      rotateY(petal.phase + frameCount * 0.03);
      fill(
        red(petal.color),
        green(petal.color),
        blue(petal.color),
        max(0, petal.alpha)
      );
      ellipsoid(2.4, 6.5, 2.0);
      pop();
    }
  }

  drawGeranium(petalColor, alpha = 255, bloomProgress = 1) {
    push();
    noStroke();

    const petalCount = 8;
    const radius = 5.2;

    // pétalos
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

    // pétalos internos, más chicos
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

    // centro
    const centerProgress = constrain((bloomProgress - 0.65) / 0.35, 0, 1);
    const easedCenter = centerProgress * centerProgress * (3 - 2 * centerProgress);

    fill(245, 230, 130, alpha * easedCenter);
    scale(easedCenter);
    ellipsoid(2.8, 2.8, 0.8);

    pop();
  }
}