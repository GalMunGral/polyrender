import { Renderer } from "polyrender/Renderer";
import { toPolygon } from "polyrender/Path.js";
import { FontBook, makeText } from "polyrender/Text";

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
        } else if (type == "click") {
          location.href = "./cpu";
        }
        render();
      },
      true
    );
  }

  render();
}
