// src/CyclicList.ts
var CyclicList = class {
  constructor(items = []) {
    this.items = items;
  }
  cur = 0;
  [Symbol.iterator]() {
    return function* (list) {
      const n = list.size;
      for (let i = 0; i < n; ++i) {
        yield list.get(i);
      }
    }(this);
  }
  get size() {
    return this.items.length;
  }
  clone() {
    return new CyclicList(this.items);
  }
  rotate(k) {
    this.items = [...this.items.slice(k), ...this.items.slice(0, k)];
  }
  get(i) {
    i %= this.size;
    if (i < 0)
      i += this.size;
    return this.items[i];
  }
  push(...items) {
    this.items.push(...items);
  }
  delete(i) {
    i %= this.size;
    if (i < 0)
      i += this.size;
    this.items.splice(i, 1);
  }
  insert(i, ...items) {
    i %= this.size;
    if (i < 0)
      i += this.size;
    this.items.splice(i, 0, ...items);
  }
  map(f) {
    return new CyclicList(this.items.map(f));
  }
};

// src/Vector.ts
var { max, abs, sqrt, sin, cos } = Math;
var Vector = class {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    if (isNaN(x) || isNaN(y)) {
      throw new Error("invalid coordinates!");
    }
  }
  clone() {
    return new Vector(this.x, this.y);
  }
  equals(other) {
    return max(abs(this.x - other.x), abs(this.y - other.y)) < 1e-9;
  }
  norm() {
    return sqrt(this.x ** 2 + this.y ** 2);
  }
  add(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }
  sub(other) {
    return new Vector(this.x - other.x, this.y - other.y);
  }
  scale(c) {
    return new Vector(this.x * c, this.y * c);
  }
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }
  cross(other) {
    return this.x * other.y - this.y * other.x;
  }
  normalize() {
    const n = this.norm();
    if (n == 0)
      throw "Can't normalize zero vector!";
    return this.scale(1 / n);
  }
  dist(other) {
    return other.sub(this).norm();
  }
  translate(dx, dy) {
    return new Vector(this.x + dx, this.y + dy);
  }
  rotate(theta) {
    return new Vector(
      this.x * cos(theta) - this.y * sin(theta),
      this.x * sin(theta) + this.y * cos(theta)
    );
  }
  interpolate(other, t) {
    return new Vector(
      (1 - t) * this.x + t * other.x,
      (1 - t) * this.y + t * other.y
    );
  }
};

// src/Bezier.ts
function bezier(controlPoints, t) {
  const points = [...controlPoints];
  while (points.length > 1) {
    for (let i = 0; i < points.length - 1; ++i) {
      const { x: x1, y: y1 } = points[i];
      const { x: x2, y: y2 } = points[i + 1];
      points[i] = new Vector((1 - t) * x1 + t * x2, (1 - t) * y1 + t * y2);
    }
    points.length--;
  }
  return points[0];
}
function sampleBezier(controlPoints, samplingRate) {
  const dist = controlPoints[0].sub(controlPoints[controlPoints.length - 1]).norm();
  const n = samplingRate ?? Math.min(Math.max(Math.round(controlPoints.length * (20 / dist)), 1), 20);
  const path = new CyclicList();
  for (let t = 0; t < 1; t += 1 / n) {
    path.push(bezier([...controlPoints], t));
  }
  path.push(bezier([...controlPoints], 1));
  return path;
}

// src/Edge.ts
var Edge = class {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }
  get reversed() {
    return this.p1.y > this.p2.y;
  }
  get x1() {
    return this.reversed ? this.p2.x : this.p1.x;
  }
  get y1() {
    return this.reversed ? this.p2.y : this.p1.y;
  }
  get x2() {
    return this.reversed ? this.p1.x : this.p2.x;
  }
  get y2() {
    return this.reversed ? this.p1.y : this.p2.y;
  }
  compare(other) {
    return this.y1 == other.y1 ? this.x1 - other.x1 : this.y1 - other.y1;
  }
  translate(dx, dy) {
    return new Edge(this.p1.translate(dx, dy), this.p2.translate(dx, dy));
  }
  rotate(theta) {
    return new Edge(this.p1.rotate(theta), this.p2.rotate(theta));
  }
  publicscale(c) {
    return new Edge(this.p1.scale(c), this.p2.scale(c));
  }
};

// src/Triangulation.ts
var epsilon = 1e-9;
var Mesh = class {
  constructor(vertices, triangles, paths) {
    this.vertices = vertices;
    this.triangles = triangles;
    this.paths = paths;
  }
};
function isInside(a, b, c, p) {
  const v0 = b.sub(a);
  const v1 = c.sub(a);
  const v2 = p.sub(a);
  const d00 = v0.dot(v0);
  const d01 = v0.dot(v1);
  const d11 = v1.dot(v1);
  const d20 = v2.dot(v0);
  const d21 = v2.dot(v1);
  const denom = d00 * d11 - d01 * d01;
  const v = (d11 * d20 - d01 * d21) / denom;
  const w = (d00 * d21 - d01 * d20) / denom;
  const u = 1 - v - w;
  return v >= -epsilon && w >= -epsilon && u >= -epsilon;
}
function isClockwise(a, b, c) {
  return b.sub(a).cross(c.sub(a)) > 0;
}
function isPathClockwise(vertices, cycle) {
  let j = 0;
  for (let i = 0; i < cycle.size; ++i) {
    const cur = vertices[cycle.get(i)];
    const best = vertices[cycle.get(j)];
    if (cur.x < best.x || cur.x == best.x && cur.y < best.y) {
      j = i;
    }
  }
  return isClockwise(
    vertices[cycle.get(j - 1)],
    vertices[cycle.get(j)],
    vertices[cycle.get(j + 1)]
  );
}
function simplify(vertices, cycles) {
  const outerCycles = [];
  const innerCycles = [];
  for (const cycle of cycles) {
    if (isPathClockwise(vertices, cycle)) {
      outerCycles.push(cycle);
    } else {
      let j = 0;
      for (let i = 0; i < cycle.size; ++i) {
        const best = vertices[cycle.get(j)];
        const cur = vertices[cycle.get(i)];
        if (cur.x > best.x || cur.x == best.x && cur.y > best.y) {
          j = i;
        }
      }
      cycle.rotate(j);
      innerCycles.push(cycle);
    }
  }
  innerCycles.sort((a, b) => vertices[a.get(0)].x - vertices[b.get(0)].x);
  while (innerCycles.length) {
    const inner = innerCycles.pop();
    const o = vertices[inner.get(0)];
    let outer = null;
    let j = -1;
    let minX = Infinity;
    for (const cycle of outerCycles) {
      for (let i = 0; i < cycle.size; ++i) {
        const p1 = vertices[cycle.get(i)];
        const p2 = vertices[cycle.get(i + 1)];
        if (p1.y <= o.y && p2.y >= o.y) {
          const k = (p2.x - p1.x) / (p2.y - p1.y);
          const x = p1.x + k * (o.y - p1.y);
          if (x > o.x && x < minX) {
            outer = cycle;
            j = i;
            minX = x;
          }
        }
      }
    }
    if (!outer) {
      console.error("found a hole not contained in any polygon");
      continue;
    }
    const c = new Vector(minX, o.y);
    const m = vertices[outer.get(j)];
    for (let i = 0; i < outer.size; ++i) {
      const best = vertices[outer.get(j)];
      const cur = vertices[outer.get(i)];
      if (isInside(o, m, c, cur) && cur.normalize().x > best.normalize().x) {
        j = i;
      }
    }
    outer.insert(j + 1, ...inner, inner.get(0), outer.get(j));
  }
  return outerCycles;
}
function triangulateComponent(vertices, indexPath, triangles) {
  const N = indexPath.size;
  let ears = [];
  for (let i = 0; i < N; ++i) {
    if (isEar(i))
      ears.push(i);
  }
  while (indexPath.size > 3 && ears.length) {
    const i = ears.pop();
    triangles.push([
      indexPath.get(i - 1),
      indexPath.get(i),
      indexPath.get(i + 1)
    ]);
    ears = ears.filter((j) => j != mod(i - 1) && j != mod(i + 1)).map((j) => j < i ? j : j - 1);
    indexPath.delete(i);
    if (isEar(i - 1)) {
      ears.push(mod(i - 1));
    }
    if (isEar(i)) {
      ears.push(mod(i));
    }
  }
  if (indexPath.size == 3) {
    triangles.push([indexPath.get(0), indexPath.get(1), indexPath.get(2)]);
  }
  function mod(i) {
    const N2 = indexPath.size;
    i %= N2;
    if (i < 0)
      i += N2;
    return i;
  }
  function isEar(i) {
    if (!isClockwise(
      vertices[indexPath.get(i - 1)],
      vertices[indexPath.get(i)],
      vertices[indexPath.get(i + 1)]
    )) {
      return false;
    }
    const prev = indexPath.get(i - 1);
    const cur = indexPath.get(i);
    const next = indexPath.get(i + 1);
    for (const idx of indexPath) {
      if (idx != cur && idx != prev && idx != next && isInside(vertices[prev], vertices[cur], vertices[next], vertices[idx])) {
        return false;
      }
    }
    return true;
  }
}
function triangulate(paths) {
  const vertices = [];
  const triangles = [];
  const cycles = [];
  for (const path of paths) {
    if (path.size < 3)
      continue;
    const cycle = new CyclicList();
    for (const p of path) {
      cycle.push(vertices.length);
      vertices.push(p);
    }
    cycles.push(cycle);
  }
  const simplified = simplify(vertices, cycles);
  for (const cycle of simplified) {
    triangulateComponent(vertices, cycle, triangles);
  }
  return new Mesh(vertices, triangles, paths);
}

// src/Polygon.ts
var ActiveEdge = class {
  constructor(maxY, x, k, reversed) {
    this.maxY = maxY;
    this.x = x;
    this.k = k;
    this.reversed = reversed;
  }
};
var Polygon = class {
  _visibleEdges = null;
  _triangularMesh;
  paths;
  constructor(paths) {
    this.paths = paths.map(function dedupe(path) {
      const res2 = new CyclicList();
      let prev = path.get(-1);
      for (const p of path) {
        if (!p.equals(prev))
          res2.push(p);
        prev = p;
      }
      return res2;
    });
  }
  get mesh() {
    if (!this._triangularMesh) {
      this._triangularMesh = triangulate(this.paths);
    }
    return this._triangularMesh;
  }
  get visibleEdges() {
    if (!this._visibleEdges) {
      const edges = [];
      for (const path of this.paths) {
        const n = path.size;
        for (let i = 0; i < n; ++i) {
          edges.push(new Edge(path.get(i), path.get(i + 1)));
        }
      }
      this._visibleEdges = edges.filter(({ y1, y2 }) => Math.ceil(y1) < y2).sort((e1, e2) => e1.compare(e2));
    }
    return this._visibleEdges;
  }
  contains({ x, y }) {
    let winding = 0;
    for (const { x1, y1, x2, y2, reversed } of this.visibleEdges) {
      if (y1 > y)
        break;
      if (y2 <= y)
        continue;
      const k = (x2 - x1) / (y2 - y1);
      const z = x1 + k * (y - y1);
      if (z > x) {
        winding += reversed ? -1 : 1;
      }
    }
    return winding != 0;
  }
  traverse(fn) {
    if (!this.visibleEdges.length)
      return;
    let y = Math.ceil(this.visibleEdges[0].y1) - 1;
    let active = [];
    let i = 0;
    do {
      if (active.length & 1) {
        throw "Odd number of intersections. The path is not closed!";
      }
      for (let i2 = 0, winding = 0; i2 < active.length; ++i2) {
        if (winding) {
          for (let x = Math.ceil(active[i2 - 1].x); x < active[i2].x; ++x) {
            fn(x, y);
          }
        }
        winding += active[i2].reversed ? -1 : 1;
      }
      ++y;
      active = active.filter((e) => e.maxY > y);
      for (const edge of active) {
        edge.x += edge.k;
      }
      while (i < this.visibleEdges.length && this.visibleEdges[i].y1 <= y) {
        const { x1, y1, x2, y2, reversed } = this.visibleEdges[i++];
        const k = (x2 - x1) / (y2 - y1);
        active.push(new ActiveEdge(y2, x1 + k * (y - y1), k, reversed));
      }
      active.sort((e1, e2) => e1.x - e2.x);
    } while (active.length || i < this.visibleEdges.length);
  }
  translate(dx, dy) {
    return new Polygon(
      this.paths.map((path) => path.map((p) => p.translate(dx, dy)))
    );
  }
  rotate(theta) {
    return new Polygon(
      this.paths.map((path) => path.map((p) => p.rotate(theta)))
    );
  }
  scale(c) {
    return new Polygon(this.paths.map((path) => path.map((p) => p.scale(c))));
  }
};

// src/Path.ts
var { cos: cos2, sin: sin2, acos, PI, sqrt: sqrt2 } = Math;
function toPolygon(d) {
  const path = parseSvgPath(d);
  let start = null;
  let prev = null;
  let vertices = new CyclicList();
  for (const cmd of path) {
    switch (cmd.type) {
      case "MOVE_TO": {
        start = prev = new Vector(cmd.x, cmd.y);
        break;
      }
      case "LINE_TO": {
        const p = new Vector(cmd.x, cmd.y);
        vertices.push(prev);
        prev = p;
        break;
      }
      case "QUADRATIC_BEZIER": {
        vertices.push(
          ...sampleBezier([
            prev,
            new Vector(cmd.cx, cmd.cy),
            new Vector(cmd.x, cmd.y)
          ])
        );
        prev = new Vector(cmd.x, cmd.y);
        break;
      }
      case "CUBIC_BEZIER": {
        vertices.push(
          ...sampleBezier([
            prev,
            new Vector(cmd.cx1, cmd.cy1),
            new Vector(cmd.cx2, cmd.cy2),
            new Vector(cmd.x, cmd.y)
          ])
        );
        prev = new Vector(cmd.x, cmd.y);
        break;
      }
      case "ELLIPSE": {
      }
      case "CLOSE_PATH": {
        vertices.push(start);
        prev = null;
        break;
      }
    }
  }
  const polygon = new Polygon([vertices]);
  if (polygon.paths[0].size && !isPathClockwise2(polygon.paths[0])) {
    polygon.paths[0].items.reverse();
  }
  polygon.paths[0].items = polygon.paths[0].items.map(
    (p) => p.translate(500, 200).scale(1.5)
  );
  return polygon;
}
function isClockwise2(a, b, c) {
  return b.sub(a).cross(c.sub(a)) > 0;
}
function isPathClockwise2(cycle) {
  let j = 0;
  for (let i = 0; i < cycle.size; ++i) {
    const cur = cycle.get(i);
    const best = cycle.get(j);
    if (cur.x < best.x || cur.x == best.x && cur.y < best.y) {
      j = i;
    }
  }
  return isClockwise2(cycle.get(j - 1), cycle.get(j), cycle.get(j + 1));
}
function parseSvgPath(d) {
  let i = 0;
  let cx = 0, cy = 0, x = 0, y = 0;
  let isPrevCubic = false;
  let isPrevQuadratic = false;
  const res2 = Array();
  space();
  while (i < d.length) {
    let node = parseCommands();
    if (!node.length)
      throw [res2, d.slice(i), i];
    res2.push(...node);
    space();
  }
  function command() {
    let res3 = d[i++];
    separator();
    return res3;
  }
  function parseCommands() {
    try {
      switch (command()) {
        case "M":
          return moveTo();
        case "m":
          return moveToDelta();
        case "L":
          return lineTo();
        case "l":
          return lineToDelta();
        case "H":
          return hLineTo();
        case "h":
          return hLineToDelta();
        case "V":
          return vLineTo();
        case "v":
          return vLineToDelta();
        case "C":
          return cubicBezier();
        case "c":
          return cubicBezierDelta();
        case "S":
          return smoothCubicBezier();
        case "s":
          return smoothCubicBezierDelta();
        case "Q":
          return quadraticBezier();
        case "q":
          return quadraticBezierDelta();
        case "T":
          return smoothQuadraticBezier();
        case "t":
          return smoothQuadraticBezierDelta();
        case "A":
          return ellipse();
        case "a":
          return ellipseDelta();
        case "Z":
        case "z":
          return closePath();
      }
    } catch (e) {
      console.log(e);
    }
    return [];
  }
  function space() {
    if (i >= d.length)
      return false;
    while (i < d.length && /\s/.test(d[i]))
      ++i;
    return true;
  }
  function separator() {
    space();
    if (i < d.length - 1 && /[\s,]/.test(d[i]) && /[^\s,]/.test(d[i + 1])) {
      ++i;
    }
    space();
    return true;
  }
  function flag() {
    if (d[i] > "1" || d[i] < "0")
      throw {
        error: "failed to parse flag",
        location: d.slice(i),
        res: res2
      };
    return d[i++] == "1";
  }
  function number() {
    const reg = /[+-]?((0|[1-9]\d*)?\.\d*[1-9]|(0|[1-9]\d*))/y;
    reg.lastIndex = i;
    const match = reg.exec(d);
    if (!match)
      throw {
        error: "failed to parse number",
        location: d.slice(i),
        res: res2
      };
    i += match[0].length;
    separator();
    return Number(match[0]);
  }
  function moveTo() {
    const res3 = [];
    do {
      x = number();
      y = number();
      res3.push({ type: "MOVE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function moveToDelta() {
    const res3 = [];
    do {
      x += number();
      y += number();
      res3.push({ type: "MOVE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function lineTo() {
    const res3 = [];
    do {
      x = number();
      y = number();
      res3.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function lineToDelta() {
    const res3 = [];
    do {
      x += number();
      y += number();
      res3.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function hLineTo() {
    const res3 = [];
    do {
      x = number();
      res3.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function hLineToDelta() {
    const res3 = [];
    do {
      x += number();
      res3.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function vLineTo() {
    const res3 = [];
    do {
      y = number();
      res3.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function vLineToDelta() {
    const res3 = [];
    do {
      y += number();
      res3.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function cubicBezier() {
    const res3 = [];
    do {
      let cx1 = number();
      let cy1 = number();
      let cx2 = cx = number();
      let cy2 = cy = number();
      x = number();
      y = number();
      res3.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res3;
  }
  function cubicBezierDelta() {
    const res3 = [];
    do {
      let cx1 = x + number();
      let cy1 = y + number();
      let cx2 = cx = x + number();
      let cy2 = cy = y + number();
      x += number();
      y += number();
      res3.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res3;
  }
  function smoothCubicBezier() {
    const res3 = [];
    do {
      let cx1 = isPrevCubic ? 2 * x - cx : x;
      let cy1 = isPrevCubic ? 2 * y - cy : y;
      let cx2 = cx = number();
      let cy2 = cy = number();
      x = number();
      y = number();
      res3.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res3;
  }
  function smoothCubicBezierDelta() {
    const res3 = [];
    do {
      let cx1 = isPrevCubic ? 2 * x - cx : x;
      let cy1 = isPrevCubic ? 2 * y - cy : y;
      let cx2 = cx = x + number();
      let cy2 = cy = y + number();
      x += number();
      y += number();
      res3.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res3;
  }
  function quadraticBezier() {
    const res3 = [];
    do {
      cx = number();
      cy = number();
      x = number();
      y = number();
      res3.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res3;
  }
  function quadraticBezierDelta() {
    const res3 = [];
    do {
      cx = x + number();
      cy = y + number();
      x += number();
      y += number();
      res3.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res3;
  }
  function smoothQuadraticBezier() {
    const res3 = [];
    do {
      cx = isPrevQuadratic ? 2 * x - cx : x;
      cy = isPrevQuadratic ? 2 * y - cy : y;
      x = number();
      y = number();
      res3.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res3;
  }
  function smoothQuadraticBezierDelta() {
    const res3 = [];
    do {
      cx = isPrevQuadratic ? 2 * x - cx : x;
      cy = isPrevQuadratic ? 2 * y - cy : y;
      x += number();
      y += number();
      res3.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res3;
  }
  function angle(ux, uy, vx, vy) {
    let sign = ux * vy - uy * vx > 0 ? 1 : -1;
    return acos(
      (ux * vx + uy * vy) / (sqrt2(ux ** 2 + uy ** 2) * sqrt2(vx ** 2 + vy ** 2))
    ) * sign;
  }
  function makeArc(x1, y1, x2, y2, rx, ry, theta, largeArc, sweep) {
    let x1$ = cos2(theta) * (x1 - x2) / 2 + sin2(theta) * (y1 - y2) / 2;
    let y1$ = -sin2(theta) * (x1 - x2) / 2 + cos2(theta) * (y1 - y2) / 2;
    let factor = sqrt2(
      (rx ** 2 * ry ** 2 - rx ** 2 * y1$ ** 2 - ry ** 2 * x1$ ** 2) / (rx ** 2 * y1$ ** 2 + ry ** 2 * x1$ ** 2)
    );
    if (largeArc == sweep)
      factor = -factor;
    let cx$ = factor * rx * y1$ / ry;
    let cy$ = -factor * ry * x1$ / rx;
    let cx2 = cos2(theta) * cx$ - sin2(theta) * cy$ + (x1 + x2) / 2;
    let cy2 = sin2(theta) * cx$ + cos2(theta) * cy$ + (y1 + y2) / 2;
    let startAngle = angle(1, 0, x1$ - cx$, y1$ - cy$);
    let delta = angle(x1$ - cx$, y1$ - cy$, -x1$ - cx$, -y1$ - cy$);
    if (sweep && delta < 0)
      delta += 2 * PI;
    else if (!sweep && delta > 0)
      delta -= 2 * PI;
    return {
      type: "ELLIPSE",
      cx: cx2,
      cy: cy2,
      rx,
      ry,
      rotation: theta,
      startAngle,
      endAngle: startAngle + delta,
      counterclockwise: !sweep
    };
  }
  function ellipse() {
    const res3 = [];
    do {
      let x1 = x;
      let y1 = y;
      let rx = number();
      let ry = number();
      let angle2 = number();
      let largeArc = flag();
      let sweep = flag();
      x = number();
      y = number();
      res3.push(
        makeArc(x1, y1, x, y, rx, ry, angle2 * PI / 180, largeArc, sweep)
      );
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function ellipseDelta() {
    const res3 = [];
    do {
      let x1 = x;
      let y1 = y;
      let rx = number();
      let ry = number();
      let angle2 = number();
      let largeArc = flag();
      let sweep = flag();
      x += number();
      y += number();
      res3.push(
        makeArc(x1, y1, x, y, rx, ry, angle2 * PI / 180, largeArc, sweep)
      );
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res3;
  }
  function closePath() {
    isPrevCubic = false;
    isPrevQuadratic = false;
    return [{ type: "CLOSE_PATH" }];
  }
  return res2;
}

// demo/cpu.ts
var canvas = document.querySelector("#test");
document.body.style.margin = "0px";
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
var ctx = canvas.getContext("2d");
var imageData = new ImageData(canvas.width, canvas.height);
var res = await fetch(
  "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg"
);
var svg = new DOMParser().parseFromString(await res.text(), "text/xml");
function parseColor(s) {
  if (s.length == 7) {
    const r = parseInt(s.slice(1, 3), 16) / 255;
    const g = parseInt(s.slice(3, 5), 16) / 255;
    const b = parseInt(s.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
  } else {
    const r = parseInt(s.slice(1, 2), 16) / 15;
    const g = parseInt(s.slice(2, 3), 16) / 15;
    const b = parseInt(s.slice(3, 4), 16) / 15;
    return [r, g, b, 1];
  }
}
svg.children[0].children[0].querySelectorAll("g").forEach((el) => {
  const polygon = toPolygon(el.children[0].getAttribute("d"));
  const s = el.getAttribute("fill") ?? "#000000";
  const [r, g, b, a] = parseColor(s).map((x) => x * 255);
  polygon.traverse((x, y) => {
    const i = (y * canvas.width + x) * 4;
    imageData.data[i] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
    imageData.data[i + 3] = a;
  });
});
ctx.putImageData(imageData, 0, 0);
