import { Renderer } from "polyrender/Renderer";
import { Vector } from "polyrender/Vector";
import { Font, parse } from "opentype.js";
import { sampleBezier } from "../src/Bezier.js";
import { Polygon } from "polyrender/Polygon.js";
import { CyclicList } from "polyrender/CyclicList.js";
import { toPolygon } from "polyrender/Path.js";

export const FontBook = {
  NotoSans: parse(await (await fetch("./NotoSans.ttf")).arrayBuffer()),
  NotoSerif: parse(await (await fetch("./NotoSerif.ttf")).arrayBuffer()),
  Zapfino: parse(await (await fetch("./Zapfino.ttf")).arrayBuffer()),
};

const canvas = document.querySelector("#test") as HTMLCanvasElement;
const renderer = new Renderer(canvas);

const res = await fetch(
  "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg"
);
const svg = new DOMParser().parseFromString(await res.text(), "text/xml");

function parseColor(s: string): [number, number, number, number] {
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

svg.children[0].children[0].querySelectorAll("g").forEach((g) => {
  const polygon = toPolygon(g.children[0].getAttribute("d")!);
  const draw = renderer.prepare(polygon);
  function render() {
    const s = g.getAttribute("fill") ?? "#000000";
    const color = parseColor(s);
    draw(color);
  }

  render();
});

const fontSize = 400;
const texts = makeText(
  "hello world!",
  100,
  1200,
  400,
  FontBook.NotoSerif,
  1000 / fontSize
);

for (const text of texts) {
  const draw = renderer.prepare(text);
  let active = false;
  function render() {
    draw(
      active ? [1, 0, 0, 1] : [0, 0, 0, 1],
      undefined,
      (type) => {
        if (type == "pointerenter") {
          active = true;
        } else if (type == "pointerleave") {
          active = false;
        }
        render();
      },
      true
    );
  }

  render();
}

function makeText(
  text: string,
  dx: number,
  dy: number,
  size: number,
  font: Font,
  samplingRate: number
): Array<Polygon> {
  const polygons: Array<Polygon> = [];

  for (const path of font.getPaths(text, dx, dy, size)) {
    let start: Vector | null = null;
    let prev: Vector | null = null;
    let pathSet: Array<CyclicList<Vector>> = [];
    let current = new CyclicList<Vector>();

    for (const cmd of path.commands) {
      switch (cmd.type) {
        case "M": {
          start = prev = new Vector(cmd.x, cmd.y);
          break;
        }
        case "L": {
          const p = new Vector(cmd.x, cmd.y);
          current.push(prev!);
          prev = p;
          break;
        }
        case "Q": {
          current.push(
            ...sampleBezier(
              [prev!, new Vector(cmd.x1, cmd.y1), new Vector(cmd.x, cmd.y)],
              samplingRate
            )
          );
          prev = new Vector(cmd.x, cmd.y);
          break;
        }
        case "C": {
          current.push(
            ...sampleBezier(
              [
                prev!,
                new Vector(cmd.x1, cmd.y1),
                new Vector(cmd.x2, cmd.y2),
                new Vector(cmd.x, cmd.y),
              ],
              samplingRate
            )
          );
          prev = new Vector(cmd.x, cmd.y);
          break;
        }
        case "Z": {
          current.push(start!);
          pathSet.push(current);
          current = new CyclicList<Vector>();
          // prev = start;
          prev = null;
          break;
        }
      }
    }
    polygons.push(new Polygon(pathSet));
  }
  return polygons;
}
