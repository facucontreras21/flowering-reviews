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

  for (let i = 0; i < sideCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;

    offsets.push({
      side,
      bendX: random(3, 6) * side,
      bendZ: random(-1.5, 1.5),
      lift: random(2, 5),
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

  display(state, currentHeight, stem) {
    if (!["bloom", "alive", "dying"].includes(state)) return;

    if (state === "dying") {
      this.displayDetachedPetals();
      return;
    }

    // ===== FLOR PRINCIPAL EN LA PUNTA =====
    const topPoint = stem.getPointAt(1, state, currentHeight);

    push();
    translate(topPoint.x, topPoint.y, topPoint.z);
    rotateZ(topPoint.x * 0.015);

    // ajuste para que la base de la flor apoye en la punta
    translate(0, 4.8, 0);

    this.drawTulip(this.flowerColors[0]);
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
          ? 0.88
          : map(i, 0, sideFlowerCount - 1, 0.8, 0.94);

      const stemPoint = stem.getPointAt(t, state, currentHeight);

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

      // que la base de la flor toque el final del tallito
      translate(0, 4.2, 0);

      this.drawTulip(this.flowerColors[(i + 1) % this.flowerColors.length]);

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

  drawTulip(petalColor) {
    noStroke();

    // pétalos más cerrados, hacia arriba
    for (let i = 0; i < 4; i++) {
      push();
      rotateY(map(i, 0, 4, 0, TWO_PI));
      translate(2.2, -3.3, 0);
      rotateZ(0.35);
      fill(red(petalColor), green(petalColor), blue(petalColor), 220);
      ellipsoid(2.3, 7.8, 2.0);
      pop();
    }

    // pétalo frontal extra para que se sienta más tulipán
    push();
    translate(0, -4.5, 2.2);
    rotateX(0.15);
    fill(red(petalColor), green(petalColor), blue(petalColor), 230);
    ellipsoid(2.4, 6.7, 2.0);
    pop();

    push();
    fill(255, 230);
    sphere(1.6);
    pop();
  }
}