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
  const n = samplingRate ?? Math.min(
    Math.max(dist / 4, Math.round(controlPoints.length * (10 / dist)), 1),
    30
  );
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
      const res = new CyclicList();
      let prev = path.get(-1);
      for (const p of path) {
        if (!p.equals(prev))
          res.push(p);
        prev = p;
      }
      return res;
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
  async traverseAsync(fn) {
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
            await fn(x, y);
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
function toPolygon(d, samplingRate) {
  const path = parseSvgPath(d);
  let start = null;
  let prev = null;
  let vertices = new CyclicList();
  for (const cmd of path) {
    switch (cmd.type) {
      case "MOVE_TO": {
        const p = new Vector(cmd.x, cmd.y);
        vertices.push(p);
        start = prev = p;
        break;
      }
      case "LINE_TO": {
        const p = new Vector(cmd.x, cmd.y);
        vertices.push(p);
        prev = p;
        break;
      }
      case "QUADRATIC_BEZIER": {
        vertices.push(
          ...sampleBezier(
            [prev, new Vector(cmd.cx, cmd.cy), new Vector(cmd.x, cmd.y)],
            samplingRate
          )
        );
        prev = new Vector(cmd.x, cmd.y);
        break;
      }
      case "CUBIC_BEZIER": {
        vertices.push(
          ...sampleBezier(
            [
              prev,
              new Vector(cmd.cx1, cmd.cy1),
              new Vector(cmd.cx2, cmd.cy2),
              new Vector(cmd.x, cmd.y)
            ],
            samplingRate
          )
        );
        prev = new Vector(cmd.x, cmd.y);
        break;
      }
      case "ELLIPSE": {
        break;
      }
      case "CLOSE_PATH": {
        vertices.push(start);
        prev = null;
        break;
      }
    }
  }
  if (start)
    vertices.push(start);
  const polygon = new Polygon([vertices]);
  if (polygon.paths[0].size && !isPathClockwise2(polygon.paths[0])) {
    polygon.paths[0].items.reverse();
  }
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
  const res = Array();
  space();
  while (i < d.length) {
    let node = parseCommands();
    if (!node.length)
      throw [res, d.slice(i), i];
    res.push(...node);
    space();
  }
  function command() {
    let res2 = d[i++];
    separator();
    return res2;
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
        res
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
        res
      };
    i += match[0].length;
    separator();
    return Number(match[0]);
  }
  function moveTo() {
    const res2 = [];
    let first = true;
    do {
      x = number();
      y = number();
      if (first) {
        first = false;
        res2.push({ type: "MOVE_TO", x, y });
      } else {
        res2.push({ type: "LINE_TO", x, y });
      }
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function moveToDelta() {
    const res2 = [];
    let first = true;
    do {
      x += number();
      y += number();
      if (first) {
        first = false;
        res2.push({ type: "MOVE_TO", x, y });
      } else {
        res2.push({ type: "LINE_TO", x, y });
      }
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function lineTo() {
    const res2 = [];
    do {
      x = number();
      y = number();
      res2.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function lineToDelta() {
    const res2 = [];
    do {
      x += number();
      y += number();
      res2.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function hLineTo() {
    const res2 = [];
    do {
      x = number();
      res2.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function hLineToDelta() {
    const res2 = [];
    do {
      x += number();
      res2.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function vLineTo() {
    const res2 = [];
    do {
      y = number();
      res2.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function vLineToDelta() {
    const res2 = [];
    do {
      y += number();
      res2.push({ type: "LINE_TO", x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function cubicBezier() {
    const res2 = [];
    do {
      let cx1 = number();
      let cy1 = number();
      let cx2 = cx = number();
      let cy2 = cy = number();
      x = number();
      y = number();
      res2.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res2;
  }
  function cubicBezierDelta() {
    const res2 = [];
    do {
      let cx1 = x + number();
      let cy1 = y + number();
      let cx2 = cx = x + number();
      let cy2 = cy = y + number();
      x += number();
      y += number();
      res2.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res2;
  }
  function smoothCubicBezier() {
    const res2 = [];
    do {
      let cx1 = isPrevCubic ? 2 * x - cx : x;
      let cy1 = isPrevCubic ? 2 * y - cy : y;
      let cx2 = cx = number();
      let cy2 = cy = number();
      x = number();
      y = number();
      res2.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res2;
  }
  function smoothCubicBezierDelta() {
    const res2 = [];
    do {
      let cx1 = isPrevCubic ? 2 * x - cx : x;
      let cy1 = isPrevCubic ? 2 * y - cy : y;
      let cx2 = cx = x + number();
      let cy2 = cy = y + number();
      x += number();
      y += number();
      res2.push({ type: "CUBIC_BEZIER", cx1, cy1, cx2, cy2, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = true;
    isPrevQuadratic = false;
    return res2;
  }
  function quadraticBezier() {
    const res2 = [];
    do {
      cx = number();
      cy = number();
      x = number();
      y = number();
      res2.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res2;
  }
  function quadraticBezierDelta() {
    const res2 = [];
    do {
      cx = x + number();
      cy = y + number();
      x += number();
      y += number();
      res2.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res2;
  }
  function smoothQuadraticBezier() {
    const res2 = [];
    do {
      cx = isPrevQuadratic ? 2 * x - cx : x;
      cy = isPrevQuadratic ? 2 * y - cy : y;
      x = number();
      y = number();
      res2.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res2;
  }
  function smoothQuadraticBezierDelta() {
    const res2 = [];
    do {
      cx = isPrevQuadratic ? 2 * x - cx : x;
      cy = isPrevQuadratic ? 2 * y - cy : y;
      x += number();
      y += number();
      res2.push({ type: "QUADRATIC_BEZIER", cx, cy, x, y });
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = true;
    return res2;
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
    const res2 = [];
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
      res2.push(
        makeArc(x1, y1, x, y, rx, ry, angle2 * PI / 180, largeArc, sweep)
      );
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function ellipseDelta() {
    const res2 = [];
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
      res2.push(
        makeArc(x1, y1, x, y, rx, ry, angle2 * PI / 180, largeArc, sweep)
      );
    } while (!/[a-zA-Z]/.test(d[i]));
    isPrevCubic = false;
    isPrevQuadratic = false;
    return res2;
  }
  function closePath() {
    isPrevCubic = false;
    isPrevQuadratic = false;
    return [{ type: "CLOSE_PATH" }];
  }
  return res;
}

// demo/cpu.ts
var canvas = document.querySelector("#test");
document.body.style.margin = "0px";
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
var ctx = canvas.getContext("2d");
var tigerSvg = new DOMParser().parseFromString(
  await (await fetch(
    "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg"
  )).text(),
  "text/xml"
);
var Tiger = class {
  colors = [];
  polygons = [];
  constructor() {
    tigerSvg.children[0].children[0].querySelectorAll("g").forEach((g) => {
      if (g.children[0].id == "path464") {
        g.children[0].setAttribute(
          "d",
          "M 20.895 54.407 c 1.542 1.463 28.505 30.393 28.505 30.393 c 35.2 36.6 7.2 2.4 7.2 2.4 c -7.6 -4.8 -16.8 -23.6 -16.8 -23.6 c -1.2 -2.8 14 7.2 14 7.2 c 4 0.8 17.6 20 17.6 20 c -6.8 -2.4 -2 4.8 -2 4.8 c 2.8 2 23.201 17.6 23.201 17.6 c 3.6 4 7.599 5.6 7.599 5.6 c 14 -5.2 7.6 8 7.6 8 c 2.4 6.8 8 -4.8 8 -4.8 c 11.2 -16.8 -5.2 -14.4 -5.2 -14.4 c -30 2.8 -36.8 -13.2 -36.8 -13.2 c -2.4 -2.4 6.4 0 6.4 0 c 8.401 2 -7.2 -12.4 -7.2 -12.4 c 2.4 0 11.6 6.8 11.6 6.8 c 10.401 9.2 12.401 7.2 12.401 7.2 c 17.999 -8.8 28.399 -1.2 28.399 -1.2 c 2 1.6 -3.6 8.4 -2 13.6 s 6.4 17.6 6.4 17.6 c -2.4 1.6 -2 12.4 -2 12.4 c 16.8 23.2 7.2 21.2 7.2 21.2 c -15.6 -0.4 -0.8 7.2 -0.8 7.2 c 3.2 2 12 9.2 12 9.2 c -2.8 -1.2 -4.4 4 -4.4 4 c 4.8 4 2 8.8 2 8.8 c -6 1.2 -7.2 5.2 -7.2 5.2 c 6.8 8 -3.2 8.4 -3.2 8.4 c 3.6 4.4 -1.2 16.4 -1.2 16.4 c -4.8 0 -11.2 5.6 -11.2 5.6 c 2.4 4.8 -8 10.4 -8 10.4 c -8.4 1.6 -5.6 8.4 -5.6 8.4 c -7.999 6 -10.399 22 -10.399 22 c -0.8 10.4 -3.2 13.6 2 11.6 c 5.199 -2 4.399 -14.4 4.399 -14.4 c -4.799 -15.6 38 -31.6 38 -31.6 c 4 -1.6 4.8 -6.8 4.8 -6.8 c 2 0.4 10.8 8 10.8 8 c 7.6 11.2 8 2 8 2 c 1.2 -3.6 -0.4 -9.6 -0.4 -9.6 c 6 -21.6 -8 -28 -8 -28 c -10 -33.6 4 -25.2 4 -25.2 c 2.8 5.6 13.6 10.8 13.6 10.8 l 3.6 -2.4 c -1.6 -4.8 6.8 -10.8 6.8 -10.8 c 2.8 6.4 8.8 -1.6 8.8 -1.6 c 3.6 -24.4 16 -10 16 -10 c 4 1.2 5.2 -5.6 5.2 -5.6 c 3.6 -10.4 0 -24 0 -24 c 3.6 -0.4 13.2 5.6 13.2 5.6 c 2.8 -3.6 -6.4 -20.4 -2.4 -18 s 8.4 4 8.4 4 c 0.8 -2 -9.2 -14.4 -9.2 -14.4 c -4.4 -2.8 -9.6 -23.2 -9.6 -23.2 c 7.2 3.6 -2.8 -11.6 -2.8 -11.6 c 0 -3.2 6 -14.4 6 -14.4 c -0.8 -6.8 0 -6.4 0 -6.4 c 2.8 1.2 10.8 2.8 4 -3.6 s 0.8 -11.2 0.8 -11.2 c 4.4 -2.8 -9.2 -2.4 -9.2 -2.4 c -5.2 -4.4 -4.8 -8.4 -4.8 -8.4 c 8 2 -6.4 -12.4 -8.8 -16 s 7.2 -8.8 7.2 -8.8 c 13.2 -3.6 1.6 -6.8 1.6 -6.8 c -19.6 0.4 -8.8 -10.4 -8.8 -10.4 c 6 0.4 4.4 -2 4.4 -2 c -5.2 -1.2 -14.8 -7.6 -14.8 -7.6 c -4 -3.6 -0.4 -2.8 -0.4 -2.8 c 16.8 1.2 -12 -10 -12 -10 c 8 0 -10 -10.4 -10 -10.4 c -2 -1.6 -5.2 -9.2 -5.2 -9.2 c -6 -5.2 -10.8 -12 -10.8 -12 c -0.4 -4.4 -5.2 -9.2 -5.2 -9.2 c -11.6 -13.6 -17.2 -13.2 -17.2 -13.2 c -14.8 -3.6 -20 -2.8 -20 -2.8 l -52.8 4.4 c -26.4 12.8 -18.6 33.8 -18.6 33.8 c 6.4 8.4 15.6 4.6 15.6 4.6 c 4.6 -6.2 16.2 -4 16.2 -4 c 20.401 3.2 17.801 -0.4 17.801 -0.4 c -2.4 -4.6 -18.601 -10.8 -18.801 -11.4 s -9 -4 -9 -4 c -3 -1.2 -7.4 -10.4 -7.4 -10.4 c -3.2 -3.4 12.6 2.4 12.6 2.4 c -1.2 1 6.2 5 6.2 5 c 17.401 -1 28.001 9.8 28.001 9.8 c 10.799 16.6 10.999 8.4 10.999 8.4 c 2.8 -9.4 -9 -30.6 -9 -30.6 c 0.4 -2 8.6 4.6 8.6 4.6 c 1.4 -2 2.2 3.8 2.2 3.8 c 0.2 2.4 4 10.4 4 10.4 c 2.8 13 6.4 5.6 6.4 5.6 l 4.6 9.4 c 1.4 2.6 -4.6 10.2 -4.6 10.2 c -0.2 2.8 0.6 2.6 -5 10.2 s -2.2 12 -2.2 12 c -1.4 6.6 7.4 6.2 7.4 6.2 c 2.6 2.2 6 2.2 6 2.2 c 1.8 2 4.2 1.4 4.2 1.4 c 1.6 -3.8 7.8 -1.8 7.8 -1.8 c 1.4 -2.4 9.6 -2.8 9.6 -2.8 c 1 -2.6 1.4 -4.2 4.8 -4.8 s -21.2 -43.6 -21.2 -43.6 c 6.4 -0.8 -1.8 -13.2 -1.8 -13.2 c -2.2 -6.6 9.2 8 11.4 9.4 s 3.2 3.6 1.6 3.4 s -3.4 2 -2 2.2 s 14.4 15.2 17.8 25.4 s 9.4 14.2 15.6 20.2 s 5.4 30.2 5.4 30.2 c -0.4 8.8 5.6 19.4 5.6 19.4 c 2 3.8 -2.2 22 -2.2 22 c -2 2.2 -0.6 3 -0.6 3 c 1 1.2 7.8 14.4 7.8 14.4 c -1.8 -0.2 1.8 3.4 1.8 3.4 c 5.2 6 -1.2 3 -1.2 3 c -6 -1.6 1 8.2 1 8.2 c 1.2 1.8 -7.8 -2.8 -7.8 -2.8 c -9.2 -0.6 2.4 6.6 2.4 6.6 c 8.6 7.2 -2.8 2.8 -2.8 2.8 c -4.6 -1.8 -1.4 5 -1.4 5 c 3.2 1.6 20.4 8.6 20.4 8.6 c 0.4 3.8 -2.6 8.8 -2.6 8.8 c 0.4 4 -1.8 7.4 -1.8 7.4 c -1.2 8.2 -1.8 9 -1.8 9 c -4.2 0.2 -11.6 14 -11.6 14 c -1.8 2.6 -12 14.6 -12 14.6 c -2 7 -20 -0.2 -20 -0.2 c -6.6 3.4 -4.6 0 -4.6 0 c -0.4 -2.2 4.4 -8.2 4.4 -8.2 c 7 -2.6 4.4 -13.4 4.4 -13.4 c 4 -1.4 -7.2 -4.2 -7 -5.4 s 6 -2.6 6 -2.6 c 8 -2 3.6 -4.4 3.6 -4.4 c -0.6 -4 2.4 -9.6 2.4 -9.6 c 11.6 -0.8 0 -17 0 -17 c -10.8 -7.6 -11.8 -13.4 -11.8 -13.4 c 12.6 -8.2 4.4 -20.6 4.6 -24.2 s 1.4 -25.2 1.4 -25.2 c -2 -6.2 -5 -19.8 -5 -19.8 c 2.2 -5.2 9.6 -17.8 9.6 -17.8 c 2.8 -4.2 11.6 -9 9.4 -12 s -10 -1.2 -10 -1.2 c -7.8 -1.4 -7.2 3.8 -7.2 3.8 c -1.6 1 -2.4 6 -2.4 6 c -0.72 7.933 -9.6 14.2 -9.6 14.2 c -11.2 6.2 -2 10.2 -2 10.2 c 6 6.6 -3.8 6.8 -3.8 6.8 c -11 -1.8 -2.8 8.4 -2.8 8.4 c 10.8 12.8 7.8 15.6 7.8 15.6 c -10.2 1 2.4 10.2 2.4 10.2 s -0.8 -2 -0.6 -0.2 s 3.2 6 4 8 s -3.2 2.2 -3.2 2.2 c 0.6 9.6 -14.8 5.4 -14.8 5.4 l -1.6 0.2 c -1.6 0.2 -12.8 -0.6 -18.6 -2.8 s -12.599 -2.2 -12.599 -2.2 s -4 1.8 -11.601 1.6 c -7.6 -0.2 -15.6 2.6 -15.6 2.6 c -4.4 -0.4 4.2 -4.8 4.4 -4.6 s 5.8 -5.4 -2.2 -4.8 c -21.797 1.635 -32.6 -8.6 -32.6 -8.6 c -2 -1.4 -4.6 -4.2 -4.6 -4.2 c -10 -2 1.4 12.4 1.4 12.4 c 1.2 1.4 -0.2 2.4 -0.2 2.4 c -0.8 -1.6 -8.6 -7 -8.6 -7 c -2.811 -0.973 -4.4 -3.2 -6.505 -4.793 z"
        );
      } else if (g.children[0].id == "path388") {
        g.children[0].setAttribute(
          "d",
          "m 50.6 84 s -20.4 -19.2 -28.4 -20 c 0 0 -33.2 -3 -49.2 14 c 0 0 17.6 -20.4 45.2 -14.8 c 0 0 -21.6 -4.4 -34 -1.2 l -26.4 14 l -2.8 4.8 s 4 -14.8 22.4 -20.8 c 0 0 21.6 -3 33.6 0 c 0 0 -21.6 -6.8 -31.6 -4.8 c 0 0 -30.4 -2.4 -43.2 24 c 0 0 4 -14.4 18.8 -21.6 c 0 0 13.6 -8.8 34 -6 c 0 0 14 2.4 19.6 5.6 s 4 -0.4 -4.4 -5.2 c 0 0 -5.6 -10 -19.6 -9.6 c 0 0 -39.6 4.6 -53.2 15.6 c 0 0 13.6 -11.2 24 -14 c 0 0 22.4 -8 30.8 -7.2 c 0 0 24.8 1 32.4 -3 c 0 0 -11.2 5 -8 8.2 s 10 10.8 10 12 s 24.2 23.3 27.8 27.7 l 2.2 2.3 z"
        );
      }
      const d = g.children[0].getAttribute("d");
      const s = g.getAttribute("fill");
      if (!s)
        return;
      const color = parseColor(s).map((x) => Math.round(x * 255));
      const polygon = toPolygon(d, 64).translate(300, 200).scale(3);
      this.polygons.push(polygon);
      this.colors.push(color);
    });
  }
  draw() {
    const imageData = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < this.polygons.length; ++i) {
      const [r, g, b, a] = this.colors[i];
      this.polygons[i].traverse((x, y) => {
        const i2 = (y * canvas.width + x) * 4;
        imageData.data[i2] = r;
        imageData.data[i2 + 1] = g;
        imageData.data[i2 + 2] = b;
        imageData.data[i2 + 3] = a;
      });
    }
    ctx.putImageData(imageData, 0, 0);
  }
  async drawWithDelay() {
    const imageData = new ImageData(canvas.width, canvas.height);
    const handle = requestAnimationFrame(function draw() {
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(draw);
    });
    const tasks = [];
    for (let i = 0; i < this.polygons.length; ++i) {
      const [r, g, b, a] = this.colors[i];
      tasks.push(
        this.polygons[i].traverseAsync(async (x, y) => {
          const i2 = (y * canvas.width + x) * 4;
          imageData.data[i2] = r;
          imageData.data[i2 + 1] = g;
          imageData.data[i2 + 2] = b;
          imageData.data[i2 + 3] = a;
          return new Promise((resolve) => {
            requestIdleCallback(() => resolve());
          });
        })
      );
    }
    await Promise.all(tasks);
    cancelAnimationFrame(handle);
  }
};
var tiger = new Tiger();
tiger.draw();
canvas.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  tiger.drawWithDelay();
};
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
