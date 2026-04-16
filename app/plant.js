class Plant {
  constructor(data, index = 0) {
    this.data = data;

    this.placeName = data.place_name || "Unknown place";
    this.rating = Number(data.rating) || 0;
    this.textLength = Number(data.text_length) || 0;
    this.flowerCount = Number(data.flower_count) || 1;
    this.lifeState = data.life_state || "lives";
    this.heightTarget = Number(data.height) || 60;
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
      this.flowers.update(this.state);
      this.currentHeight *= 0.992;

      if (elapsed > 4500) {
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
      push();
      translate(this.x, this.baseY, this.z);
      noStroke();
      fill(45);
      sphere(2.5);
      pop();
      return;
    }

    push();
    translate(this.x, this.baseY, this.z);

    this.seed.display(this.state);
    this.stem.display(this.state, this.currentHeight);
    this.flowers.display(this.state, this.currentHeight, this.stem);

    pop();
  }

  getTopWorldPosition() {
    return createVector(this.x, this.baseY - this.currentHeight, this.z);
  }

  isMouseNear() {
    const top = this.getTopWorldPosition();
    const screenPos = screenPosition(top.x, top.y, top.z);

    const d = dist(mouseX, mouseY, screenPos.x, screenPos.y);
    return d < this.hoverRadius;
  }

  getTooltipHTML() {
    return `
      <strong>${this.placeName}</strong><br/>
      País: ${this.country}<br/>
      Rating: ${this.rating} ⭐<br/>
      Texto: ${this.textLength} chars<br/>
      Flores: ${this.flowerCount}<br/>
      Estado: ${this.lifeState}
    `;
  }
}