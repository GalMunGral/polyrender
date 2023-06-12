import { toPolygon } from "polyrender/Path.js";
import { Polygon } from "polyrender/Polygon";

const canvas = document.querySelector("#test") as HTMLCanvasElement;
document.body.style.margin = "0px";
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
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

  constructor() {
    tigerSvg.children[0].children[0].querySelectorAll("g").forEach((g) => {
      // TODO: how to handle self-intersecting polygons?
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
      const d = g.children[0].getAttribute("d")!;
      const s = g.getAttribute("fill");
      if (!s) return;
      const color = parseColor(s).map((x) => Math.round(x * 255)) as [
        number,
        number,
        number,
        number
      ];
      const polygon = toPolygon(d, 64).translate(300, 200).scale(3);
      this.polygons.push(polygon);
      this.colors.push(color);
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

  public async drawWithDelay() {
    const imageData = new ImageData(canvas.width, canvas.height);
    const handle = requestAnimationFrame(function draw() {
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(draw);
    });
    for (let i = 0; i < this.polygons.length; ++i) {
      const [r, g, b, a] = this.colors[i];
      if (a == 0 || (r == 255 && g == 255 && b == 255)) continue;
      await this.polygons[i].traverseAsync(async (x, y) => {
        const i = (y * canvas.width + x) * 4;
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;
        return new Promise((resolve) => {
          setTimeout(() => resolve());
        });
      });
    }
    // cancelAnimationFrame(handle);
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
