class Plant {
  constructor(data, index = 0) {
    this.data = data;

    this.placeName = data.place_name || "Unknown place";
    this.rating = Number(data.rating) || 0;
    this.textLength = Number(data.text_length) || 0;
    this.flowerCount = Number(data.flower_count) || 1;
    this.lifeState = data.life_state || "lives";
    this.heightTarget = Number(data.height) * 0.75 || 45;
    this.country = data.country || "Unknown";
    this.lon = Number(data.lon);
    this.lat = Number(data.lat);

    this.position = projectLatLonToWorld(this.lat, this.lon);

    this.x = this.position.x + random(-5, 5);
    this.z = this.position.z + random(-5, 5);
    this.baseY = 0;
    this.currentHeight = 0;

    this.state = "seed";
    this.stateStart = millis();
    this.seedDelay = random(0, 1200);

    this.aliveSwayOffset = random(TWO_PI);
    this.deathSide = random([ -1, 1 ]);
    this.seedColor = color(random(90, 255), random(90, 255), random(90, 255));
    this.stemColor = color(random(40, 90), random(120, 220), random(60, 120));

    this.flowerColors = [];
    for (let i = 0; i < this.flowerCount; i++) {
      this.flowerColors.push(
        color(random(80, 255), random(80, 255), random(80, 255))
      );
    }

    this.seed = new Seed(this.seedColor, this.aliveSwayOffset);
    this.stem = new Stem(this.stemColor, this.aliveSwayOffset);
    this.flowers = new FlowerCluster(this.flowerCount, this.flowerColors);

    this.hoverRadius = 22;
  }

  update() {
    const elapsed = millis() - this.stateStart;

    if (this.state === "seed") {
      if (elapsed > this.seedDelay) {
        this.changeState("grow");
      }
    } else if (this.state === "grow") {
      this.currentHeight = lerp(this.currentHeight, this.heightTarget, 0.045);

      if (this.currentHeight > this.heightTarget * 0.92) {
        this.currentHeight = this.heightTarget;
        this.changeState("bloom");
        this.flowers.spawnPetals(this.currentHeight);
      }
    } else if (this.state === "bloom") {
      if (elapsed > 1200) {
        if (this.lifeState === "lives") {
          this.changeState("alive");
        } else {
          this.changeState("dying");
        }
      }
    } else if (this.state === "dying") {
      if (elapsed > 15000) {
        this.changeState("dead");
      }
    } else if (this.state === "alive") {
      this.flowers.update(this.state);
    }
  }

  changeState(newState) {
    this.state = newState;
    this.stateStart = millis();
  }

  display() {
    if (this.state === "dead") {
      return;
    }

    push();
    translate(this.x, this.baseY, this.z);

    if (this.state === "dying") {
      const elapsed = millis() - this.stateStart;
      const deathProgress = constrain(elapsed / 15000, 0, 1);

      // suaviza la caída para que no sea robótica
      const easedFall = deathProgress * deathProgress * (3 - 2 * deathProgress);

      // cae desde vertical hasta casi horizontal
      const fallAngle = easedFall * HALF_PI * this.deathSide;

      // desaparece hacia el final
      const fadeAlpha = 255

      // misma base que las plantas normales
      this.seed.display(this.state);

      push();
      rotateZ(fallAngle);

      this.stem.display(this.state, this.currentHeight);
      this.flowers.display(this.state, this.currentHeight, this.stem, fadeAlpha);

      pop();

      pop();
      return;
    }

    this.seed.display(this.state);
    this.stem.display(this.state, this.currentHeight);
    this.flowers.display(this.state, this.currentHeight, this.stem);

    pop();
  }

  getHoverWorldPosition() {
    if (this.state === "dead") {
      return createVector(this.x, this.baseY, this.z);
    }

    const topPoint = this.stem.getPointAt(1, this.state, this.currentHeight);

    return createVector(
      this.x + topPoint.x,
      this.baseY + topPoint.y,
      this.z + topPoint.z
    );
  }

  isMouseNear() {
    const hoverPoint = this.getHoverWorldPosition();
    const screenPos = screenPosition(hoverPoint.x, hoverPoint.y, hoverPoint.z);

    const radius = this.state === "dead" ? 24 : 36;
    const d = dist(mouseX, mouseY, screenPos.x, screenPos.y);

    return d < radius;
  }

  getTooltipHTML() {
    return `
      <strong>${this.placeName}</strong><br/>
      Country: ${this.country}<br/>
      Rating: ${this.rating} ⭐<br/>
      Review length: ${this.textLength} chars<br/>
      Flowers: ${this.flowerCount}<br/>
      Status: ${this.lifeState}
    `;
  }
}