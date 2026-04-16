class Seed {
  constructor(seedColor, swayOffset) {
    this.seedColor = seedColor;
    this.swayOffset = swayOffset;
  }

  display(state) {
    push();
    rotateX(HALF_PI);
    noStroke();

    const pulse = 10 + sin(frameCount * 0.05 + this.swayOffset) * 3;

    const alpha =
      state === "seed"
        ? 180
        : state === "grow"
        ? 120
        : state === "dead"
        ? 0
        : 70;

    fill(
      red(this.seedColor),
      green(this.seedColor),
      blue(this.seedColor),
      alpha
    );

    ellipse(0, 0, 18 + pulse, 18 + pulse);
    pop();
  }
}