import { Renderer } from "polyrender/Renderer";
import { Vector } from "polyrender/Vector";
import { Font, parse } from "opentype.js";
import { sampleBezier } from "./bezier.js";
import { Polygon } from "polyrender/Polygon.js";
import { CyclicList } from "polyrender/CyclicList.js";

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

const texts = makeText("hello world!", 100, 500, 400, FontBook.NotoSans);

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
