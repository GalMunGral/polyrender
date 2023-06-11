import { toPolygon } from "polyrender/Path.js";

const canvas = document.querySelector("#test") as HTMLCanvasElement;
document.body.style.margin = "0px";
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
const ctx = canvas.getContext("2d")!;
const imageData = new ImageData(canvas.width, canvas.height);

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

svg.children[0].children[0].querySelectorAll("g").forEach((el) => {
  const polygon = toPolygon(el.children[0].getAttribute("d")!);
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
