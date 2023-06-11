import { CyclicList } from "polyrender/CyclicList";
import { Polygon } from "polyrender/Polygon";
import { Vector } from "polyrender/Vector";

export function bezier(controlPoints: Array<Vector>, t: number) {
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

// TODO: fix oversampling
export function sampleBezier(controlPoints: Array<Vector>): CyclicList<Vector> {
  const dist = controlPoints[0]
    .sub(controlPoints[controlPoints.length - 1])
    .norm();

  const n = Math.max(Math.floor(dist / 10), 1);

  const path = new CyclicList<Vector>();
  for (let t = 0; t < 1; t += 1 / n) {
    path.push(bezier([...controlPoints], t));
  }

  path.push(bezier([...controlPoints], 1));

  return path;
}
