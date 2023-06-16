import { toPolygon } from "polyrender/Path.js";
import { Polygon } from "polyrender/Polygon";
import { makeStroke } from "polyrender/Stroke";

const canvas = document.querySelector("#test") as HTMLCanvasElement;
document.body.style.margin = "0px";
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
canvas.style.background = "lightgray";
const ctx = canvas.getContext("2d")!;

const tigerSvg = new DOMParser().parseFromString(
  await (
    await fetch(
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg"
    )
  ).text(),
  "text/xml"
);

const objects: Array<{ draw: () => void }> = [];
function drawScreen() {
  for (const obj of objects) {
    obj.draw();
  }
}

class Tiger {
  private colors: Array<[number, number, number, number]> = [];
  private polygons: Array<Polygon> = [];
  private isDrawing = false;

  constructor() {
    this.prepare();
  }

  private prepare() {
    this.polygons.length = 0;
    this.colors.length = 0;

    tigerSvg.children[0].children[0].querySelectorAll("g").forEach((g) => {
      const pathEl = g.children[0];
      let d = pathEl.getAttribute("d")!;
      const polygon = toPolygon(d, 64)
        .scale(3)
        .translate((3 * canvas.width) / 5, canvas.height / 4);

      const fill = g.getAttribute("fill");
      if (fill) {
        const color = parseColor(fill).map((x) => Math.round(x * 255)) as [
          number,
          number,
          number,
          number
        ];
        this.polygons.push(polygon);
        this.colors.push(color);
      }

      const stroke = g.getAttribute("stroke");
      if (stroke) {
        const strokeWidth = g.getAttribute("stroke-width") ?? "1";
        const strokeGeometry = makeStroke(
          polygon.paths[0],
          Math.max(0.5, +strokeWidth * devicePixelRatio),
          d.endsWith("z") || d.endsWith("Z")
        );
        const color = parseColor(stroke).map((x) => Math.round(x * 255)) as [
          number,
          number,
          number,
          number
        ];
        for (const poly of strokeGeometry) {
          this.polygons.push(poly);
          this.colors.push(color);
        }
      }
    });
  }

  public draw() {
    const imageData = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < this.polygons.length; ++i) {
      const [r, g, b, a] = this.colors[i];
      this.polygons[i].traverse((x, y) => {
        const i = (y * canvas.width + x) * 4;
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;
      });
    }
    ctx.putImageData(imageData, 0, 0);
  }

  public drawWithDelay() {
    if (this.isDrawing) return;
    this.isDrawing = true;
    const imageData = new ImageData(canvas.width, canvas.height);
    function* pixels(that: Tiger) {
      for (let i = 0; i < that.polygons.length; ++i) {
        // const [r, g, b, a] = that.colors[i];
        // if (a == 0 || (r == 255 && g == 255 && b == 255)) continue;
        const it = that.polygons[i].traverseAsync();
        while (true) {
          const { done, value } = it.next();
          if (done) break;
          yield { color: that.colors[i], point: value };
        }
      }
    }
    const it = pixels(this);
    const that = this;
    (function drawChunkOfPixels() {
      let n = 10000;
      while (n--) {
        const { done, value } = it.next();
        if (done) {
          that.isDrawing = false;
          return;
        }
        const {
          color: [r, g, b, a],
          point: { x, y },
        } = value;
        const i = (y * canvas.width + x) * 4;
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;
      }
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(drawChunkOfPixels);
    })();
  }
}

const tiger = new Tiger();
tiger.draw();

canvas.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  tiger.drawWithDelay();
};

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
