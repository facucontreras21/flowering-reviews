let gardenData = [];
let plants = [];
let tooltip;
let globalWind = 0;

let countryClusters = {};
let selectedCountry = "ALL";
let countrySelect;

const WORLD_WIDTH = 1400;
const WORLD_DEPTH = 700;

const cameraState = {
  currentEye: null,
  targetEye: null,
  currentCenter: null,
  targetCenter: null,
};

function preload() {
  gardenData = loadJSON("../data/processed/garden_reviews.json");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);

  tooltip = createDiv("");
  tooltip.id("tooltip");
  tooltip.style("position", "fixed");
  tooltip.style("display", "none");
  tooltip.style("pointer-events", "none");
  tooltip.style("background", "rgba(0,0,0,0.85)");
  tooltip.style("color", "#fff");
  tooltip.style("padding", "10px 12px");
  tooltip.style("border-radius", "10px");
  tooltip.style("font-size", "14px");
  tooltip.style("line-height", "1.4");

  const records = Array.isArray(gardenData) ? gardenData : Object.values(gardenData);

  plants = records.map((record, index) => new Plant(record, index));
  countryClusters = buildCountryClusters(plants);
  createCountrySelector(countryClusters);

  const initialEye = createVector(0, -420, 520);
  const initialCenter = createVector(0, 0, 0);

  cameraState.currentEye = initialEye.copy();
  cameraState.targetEye = initialEye.copy();
  cameraState.currentCenter = initialCenter.copy();
  cameraState.targetCenter = initialCenter.copy();
}

function draw() {
  background(0);

  ambientLight(140);
  directionalLight(255, 255, 255, 0.2, 0.8, -1);
  pointLight(180, 180, 220, 0, -250, 220);

  updateCameraTarget();
  applySmoothCamera();

  drawGround();
  drawClusterLabels();

  globalWind = sin(frameCount * 0.01) * 10;

  for (const plant of plants) {
    if (selectedCountry === "ALL" || plant.country === selectedCountry) {
      plant.update();
      plant.display();
    }
  }

  handleHover();
}

function drawGround() {
  push();
  rotateX(HALF_PI);
  noStroke();
  fill(5);
  plane(WORLD_WIDTH, WORLD_DEPTH);
  pop();
}

function projectLatLonToWorld(lat, lon) {
  const worldMinLon = -180;
  const worldMaxLon = 180;
  const worldMinLat = -90;
  const worldMaxLat = 90;

  const x = ((lon - worldMinLon) / (worldMaxLon - worldMinLon) - 0.5) * WORLD_WIDTH;
  const z = -((lat - worldMinLat) / (worldMaxLat - worldMinLat) - 0.5) * WORLD_DEPTH;

  return { x, z };
}

function buildCountryClusters(plantsList) {
  const clusters = {};

  for (const plant of plantsList) {
    if (!clusters[plant.country]) {
      clusters[plant.country] = {
        country: plant.country,
        plants: [],
        centerX: 0,
        centerZ: 0,
        minX: Infinity,
        maxX: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity,
      };
    }

    const cluster = clusters[plant.country];
    cluster.plants.push(plant);

    cluster.minX = min(cluster.minX, plant.x);
    cluster.maxX = max(cluster.maxX, plant.x);
    cluster.minZ = min(cluster.minZ, plant.z);
    cluster.maxZ = max(cluster.maxZ, plant.z);
  }

  for (const countryName in clusters) {
    const cluster = clusters[countryName];

    cluster.centerX = (cluster.minX + cluster.maxX) / 2;
    cluster.centerZ = (cluster.minZ + cluster.maxZ) / 2;
    cluster.spanX = max(80, cluster.maxX - cluster.minX);
    cluster.spanZ = max(80, cluster.maxZ - cluster.minZ);
  }

  return clusters;
}

function createCountrySelector(clusters) {
  countrySelect = createSelect();
  countrySelect.position(20, 20);
  countrySelect.style("padding", "8px 10px");
  countrySelect.style("border-radius", "8px");
  countrySelect.style("background", "#111");
  countrySelect.style("color", "#fff");
  countrySelect.style("border", "1px solid #444");

  countrySelect.option("ALL");

  Object.keys(clusters)
    .sort()
    .forEach((country) => {
      countrySelect.option(country);
    });

  countrySelect.changed(() => {
    selectedCountry = countrySelect.value();
  });
}

function updateCameraTarget() {
  if (selectedCountry === "ALL") {
    cameraState.targetCenter = createVector(0, 0, 0);
    cameraState.targetEye = createVector(0, -420, 520);
    return;
  }

  const cluster = countryClusters[selectedCountry];
  if (!cluster) return;

  const focusDistance = max(cluster.spanX, cluster.spanZ) * 1.2;

  cameraState.targetCenter = createVector(cluster.centerX, -40, cluster.centerZ);
  cameraState.targetEye = createVector(
    cluster.centerX,
    -180 - focusDistance * 0.35,
    cluster.centerZ + 180 + focusDistance * 0.55
  );
}

function applySmoothCamera() {
  cameraState.currentEye.lerp(cameraState.targetEye, 0.06);
  cameraState.currentCenter.lerp(cameraState.targetCenter, 0.06);

  camera(
    cameraState.currentEye.x,
    cameraState.currentEye.y,
    cameraState.currentEye.z,
    cameraState.currentCenter.x,
    cameraState.currentCenter.y,
    cameraState.currentCenter.z,
    0,
    1,
    0
  );
}

function handleHover() {
  let hoveredPlant = null;

  for (const plant of plants) {
    if (selectedCountry !== "ALL" && plant.country !== selectedCountry) continue;

    if (plant.isMouseNear()) {
      hoveredPlant = plant;
      break;
    }
  }

  if (!hoveredPlant) {
    tooltip.style("display", "none");
    return;
  }

  tooltip.html(hoveredPlant.getTooltipHTML());
  tooltip.style("display", "block");
  tooltip.position(mouseX + 16, mouseY + 16);
}

function drawClusterLabels() {
  if (selectedCountry !== "ALL") return;

  for (const countryName in countryClusters) {
    const cluster = countryClusters[countryName];
    const screenPos = screenPosition(cluster.centerX, -10, cluster.centerZ);

    push();
    resetMatrix();
    fill(255, 180);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(countryName, screenPos.x - width / 2, screenPos.y - height / 2);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  if (countrySelect) {
    countrySelect.position(20, 20);
  }
}

function screenPosition(x, y, z) {
  const position = createVector(x, y, z);

  // Proyección manual usando matrices internas de p5
  const mvMatrix = this._renderer.uMVMatrix.copy();
  const projMatrix = this._renderer.uPMatrix.copy();

  let v = createVector(position.x, position.y, position.z, 1);

  v = multiplyMatrixAndVector(mvMatrix, v);
  v = multiplyMatrixAndVector(projMatrix, v);

  // Normalizar
  v.x /= v.w;
  v.y /= v.w;
  v.z /= v.w;

  // Convertir a coordenadas de pantalla
  return createVector(
    (v.x * 0.5 + 0.5) * width,
    (1 - (v.y * 0.5 + 0.5)) * height
  );
}

function multiplyMatrixAndVector(matrix, vector) {
  const result = createVector(0, 0, 0, 0);

  result.x =
    matrix.mat4[0] * vector.x +
    matrix.mat4[4] * vector.y +
    matrix.mat4[8] * vector.z +
    matrix.mat4[12] * vector.w;

  result.y =
    matrix.mat4[1] * vector.x +
    matrix.mat4[5] * vector.y +
    matrix.mat4[9] * vector.z +
    matrix.mat4[13] * vector.w;

  result.z =
    matrix.mat4[2] * vector.x +
    matrix.mat4[6] * vector.y +
    matrix.mat4[10] * vector.z +
    matrix.mat4[14] * vector.w;

  result.w =
    matrix.mat4[3] * vector.x +
    matrix.mat4[7] * vector.y +
    matrix.mat4[11] * vector.z +
    matrix.mat4[15] * vector.w;

  return result;
}