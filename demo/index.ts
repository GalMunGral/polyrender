import { Renderer } from "polyrender/Renderer";
import { Vector } from "polyrender/Vector";
import { Font, parse } from "opentype.js";
import { sampleBezier } from "./bezier.js";
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

const shape = sampleBezier([
  new Vector(100, 100),
  new Vector(200, 200),
  new Vector(150, 600),
]);

shape.push(new Vector(100, 100));

const test =
  "M20.895,54.407c1.542,1.463,28.505,30.393,28.505,30.393,35.2,36.6,7.2,2.4,7.2,2.4-7.6-4.8-16.8-23.6-16.8-23.6-1.2-2.8,14,7.2,14,7.2,4,0.8,17.6,20,17.6,20-6.8-2.4-2,4.8-2,4.8,2.8,2,23.201,17.6,23.201,17.6,3.6,4,7.599,5.6,7.599,5.6,14-5.2,7.6,8,7.6,8,2.4,6.8,8-4.8,8-4.8,11.2-16.8-5.2-14.4-5.2-14.4-30,2.8-36.8-13.2-36.8-13.2-2.4-2.4,6.4,0,6.4,0,8.401,2-7.2-12.4-7.2-12.4,2.4,0,11.6,6.8,11.6,6.8,10.401,9.2,12.401,7.2,12.401,7.2,17.999-8.8,28.399-1.2,28.399-1.2,2,1.6-3.6,8.4-2,13.6s6.4,17.6,6.4,17.6c-2.4,1.6-2,12.4-2,12.4,16.8,23.2,7.2,21.2,7.2,21.2-15.6-0.4-0.8,7.2-0.8,7.2,3.2,2,12,9.2,12,9.2-2.8-1.2-4.4,4-4.4,4,4.8,4,2,8.8,2,8.8-6,1.2-7.2,5.2-7.2,5.2,6.8,8-3.2,8.4-3.2,8.4,3.6,4.4-1.2,16.4-1.2,16.4-4.8,0-11.2,5.6-11.2,5.6,2.4,4.8-8,10.4-8,10.4-8.4,1.6-5.6,8.4-5.6,8.4-7.999,6-10.399,22-10.399,22-0.8,10.4-3.2,13.6,2,11.6,5.199-2,4.399-14.4,4.399-14.4-4.799-15.6,38-31.6,38-31.6,4-1.6,4.8-6.8,4.8-6.8,2,0.4,10.8,8,10.8,8,7.6,11.2,8,2,8,2,1.2-3.6-0.4-9.6-0.4-9.6,6-21.6-8-28-8-28-10-33.6,4-25.2,4-25.2,2.8,5.6,13.6,10.8,13.6,10.8l3.6-2.4c-1.6-4.8,6.8-10.8,6.8-10.8,2.8,6.4,8.8-1.6,8.8-1.6,3.6-24.4,16-10,16-10,4,1.2,5.2-5.6,5.2-5.6,3.6-10.4,0-24,0-24,3.6-0.4,13.2,5.6,13.2,5.6,2.8-3.6-6.4-20.4-2.4-18s8.4,4,8.4,4c0.8-2-9.2-14.4-9.2-14.4-4.4-2.8-9.6-23.2-9.6-23.2,7.2,3.6-2.8-11.6-2.8-11.6,0-3.2,6-14.4,6-14.4-0.8-6.8,0-6.4,0-6.4,2.8,1.2,10.8,2.8,4-3.6s0.8-11.2,0.8-11.2c4.4-2.8-9.2-2.4-9.2-2.4-5.2-4.4-4.8-8.4-4.8-8.4,8,2-6.4-12.4-8.8-16s7.2-8.8,7.2-8.8c13.2-3.6,1.6-6.8,1.6-6.8-19.6,0.4-8.8-10.4-8.8-10.4,6,0.4,4.4-2,4.4-2-5.2-1.2-14.8-7.6-14.8-7.6-4-3.6-0.4-2.8-0.4-2.8,16.8,1.2-12-10-12-10,8,0-10-10.4-10-10.4-2-1.6-5.2-9.2-5.2-9.2-6-5.2-10.8-12-10.8-12-0.4-4.4-5.2-9.2-5.2-9.2-11.6-13.6-17.2-13.2-17.2-13.2-14.8-3.6-20-2.8-20-2.8l-52.8,4.4c-26.4,12.8-18.6,33.8-18.6,33.8,6.4,8.4,15.6,4.6,15.6,4.6,4.6-6.2,16.2-4,16.2-4,20.401,3.2,17.801-0.4,17.801-0.4-2.4-4.6-18.601-10.8-18.801-11.4s-9-4-9-4c-3-1.2-7.4-10.4-7.4-10.4-3.2-3.4,12.6,2.4,12.6,2.4-1.2,1,6.2,5,6.2,5,17.401-1,28.001,9.8,28.001,9.8,10.799,16.6,10.999,8.4,10.999,8.4,2.8-9.4-9-30.6-9-30.6,0.4-2,8.6,4.6,8.6,4.6,1.4-2,2.2,3.8,2.2,3.8,0.2,2.4,4,10.4,4,10.4,2.8,13,6.4,5.6,6.4,5.6l4.6,9.4c1.4,2.6-4.6,10.2-4.6,10.2-0.2,2.8,0.6,2.6-5,10.2s-2.2,12-2.2,12c-1.4,6.6,7.4,6.2,7.4,6.2,2.6,2.2,6,2.2,6,2.2,1.8,2,4.2,1.4,4.2,1.4,1.6-3.8,7.8-1.8,7.8-1.8,1.4-2.4,9.6-2.8,9.6-2.8,1-2.6,1.4-4.2,4.8-4.8s-21.2-43.6-21.2-43.6c6.4-0.8-1.8-13.2-1.8-13.2-2.2-6.6,9.2,8,11.4,9.4s3.2,3.6,1.6,3.4-3.4,2-2,2.2,14.4,15.2,17.8,25.4,9.4,14.2,15.6,20.2,5.4,30.2,5.4,30.2c-0.4,8.8,5.6,19.4,5.6,19.4,2,3.8-2.2,22-2.2,22-2,2.2-0.6,3-0.6,3,1,1.2,7.8,14.4,7.8,14.4-1.8-0.2,1.8,3.4,1.8,3.4,5.2,6-1.2,3-1.2,3-6-1.6,1,8.2,1,8.2,1.2,1.8-7.8-2.8-7.8-2.8-9.2-0.6,2.4,6.6,2.4,6.6,8.6,7.2-2.8,2.8-2.8,2.8-4.6-1.8-1.4,5-1.4,5,3.2,1.6,20.4,8.6,20.4,8.6,0.4,3.8-2.6,8.8-2.6,8.8,0.4,4-1.8,7.4-1.8,7.4-1.2,8.2-1.8,9-1.8,9-4.2,0.2-11.6,14-11.6,14-1.8,2.6-12,14.6-12,14.6-2,7-20-0.2-20-0.2-6.6,3.4-4.6,0-4.6,0-0.4-2.2,4.4-8.2,4.4-8.2,7-2.6,4.4-13.4,4.4-13.4,4-1.4-7.2-4.2-7-5.4s6-2.6,6-2.6c8-2,3.6-4.4,3.6-4.4-0.6-4,2.4-9.6,2.4-9.6,11.6-0.8,0-17,0-17-10.8-7.6-11.8-13.4-11.8-13.4,12.6-8.2,4.4-20.6,4.6-24.2s1.4-25.2,1.4-25.2c-2-6.2-5-19.8-5-19.8,2.2-5.2,9.6-17.8,9.6-17.8,2.8-4.2,11.6-9,9.4-12s-10-1.2-10-1.2c-7.8-1.4-7.2,3.8-7.2,3.8-1.6,1-2.4,6-2.4,6-0.72,7.933-9.6,14.2-9.6,14.2-11.2,6.2-2,10.2-2,10.2,6,6.6-3.8,6.8-3.8,6.8-11-1.8-2.8,8.4-2.8,8.4,10.8,12.8,7.8,15.6,7.8,15.6-10.2,1,2.4,10.2,2.4,10.2s-0.8-2-0.6-0.2,3.2,6,4,8-3.2,2.2-3.2,2.2c0.6,9.6-14.8,5.4-14.8,5.4l-1.6,0.2c-1.6,0.2-12.8-0.6-18.6-2.8s-12.599-2.2-12.599-2.2-4,1.8-11.601,1.6c-7.6-0.2-15.6,2.6-15.6,2.6-4.4-0.4,4.2-4.8,4.4-4.6s5.8-5.4-2.2-4.8c-21.797,1.635-32.6-8.6-32.6-8.6-2-1.4-4.6-4.2-4.6-4.2-10-2,1.4,12.4,1.4,12.4,1.2,1.4-0.2,2.4-0.2,2.4-0.8-1.6-8.6-7-8.6-7-2.811-0.973-4.174-2.307-6.505-4.793z";

// const svg = toPolygon(test);

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
    draw(
      color,
      undefined,
      undefined
      // true
    );
  }

  render();
});

const texts = makeText("hello world!", 100, 1200, 400, FontBook.NotoSerif);

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
  font: Font
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
            ...sampleBezier([
              prev!,
              new Vector(cmd.x1, cmd.y1),
              new Vector(cmd.x, cmd.y),
            ])
          );
          prev = new Vector(cmd.x, cmd.y);
          break;
        }
        case "C": {
          current.push(
            ...sampleBezier([
              prev!,
              new Vector(cmd.x1, cmd.y1),
              new Vector(cmd.x2, cmd.y2),
              new Vector(cmd.x, cmd.y),
            ])
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
