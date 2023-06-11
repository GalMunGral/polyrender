import { Polygon } from "./Polygon";
import { Vector } from "./Vector";

type Transform = {
  translateX?: number;
  translateY?: number;
  rotation?: number;
  scale?: number;
};
type EventHander = (type: string, x: number, y: number) => void;
type Interactive = { polygon: Polygon; eventHandler?: EventHander };

export class Renderer {
  private gl: WebGL2RenderingContext;
  private basicProgram: WebGLProgram;
  private active: Interactive | null = null;
  private interactive: Array<Interactive> = [];

  constructor(canvas: HTMLCanvasElement) {
    document.body.style.margin = "0px";
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    this.gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true })!;
    this.basicProgram = createWebGLProgram(
      this.gl,
      `#version 300 es
      uniform float viewportWidth;
      uniform float viewportHeight;
    
      in vec2 pos;
      out vec2 texCoord;
    
      void main() {
        gl_Position = vec4(
          pos.x * 2.0 / viewportWidth - 1.0,
          1.0 - pos.y * 2.0 / viewportHeight,
          0,
          1.0
        );
        gl_PointSize = 4.0;
      }
    `,
      `#version 300 es
      precision mediump float;
    
      uniform vec4 color;
      out vec4 fragColor;
    
      void main() {
        // color = texture2D(uSampler, texCoord);
        fragColor = color;
      }
    `
    );

    canvas.addEventListener("click", (e) => {
      const type = e.type;
      const x = e.offsetX * devicePixelRatio;
      const y = e.offsetY * devicePixelRatio;
      for (const area of this.interactive) {
        if (area.eventHandler && area.polygon.contains(new Vector(x, y))) {
          area.eventHandler(type, x, y);
          break;
        }
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      const type = e.type;
      const x = e.offsetX * devicePixelRatio;
      const y = e.offsetY * devicePixelRatio;
      let active: Interactive | null = null;
      for (const area of this.interactive) {
        if (area.eventHandler && area.polygon.contains(new Vector(x, y))) {
          area.eventHandler(type, x, y);
          active = area;
          break;
        }
      }
      if (this.active != active) {
        this.active?.eventHandler?.("pointerleave", x, y);
        active?.eventHandler?.("pointerenter", x, y);
        this.active = active;
      }
    });

    // new ResizeObserver((entries) => {
    //   const { inlineSize, blockSize } = entries[0].contentBoxSize[0];
    //   const width = devicePixelRatio * inlineSize;
    //   const height = devicePixelRatio * blockSize;
    //   gl.uniform1f(this.viewportWidthLoc, width);
    //   gl.uniform1f(this.viewportHeightLoc, height);
    //   gl.viewport(0, 0, width, height);
    // }).observe(canvas);
  }

  // test() {
  //   this.viewportWidthLoc = gl.getUniformLocation(program, "viewportWidth");
  //   this.viewportHeightLoc = gl.getUniformLocation(program, "viewportHeight");
  // }

  // this.viewportWidthLoc = gl.getUniformLocation(program, "viewportWidth");
  // this.viewportHeightLoc = gl.getUniformLocation(program, "viewportHeight");

  prepare(polygon: Polygon) {
    const gl = this.gl;
    const program = this.basicProgram;
    const { vertices, triangles, paths } = polygon.mesh;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertices.flatMap(({ x, y }) => [x, y])),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const triangleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuf);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(triangles.flat()),
      gl.STATIC_DRAW
    );

    const lines: Array<[number, number]> = [];
    for (const tri of triangles) {
      lines.push([tri[0], tri[1]]);
      lines.push([tri[1], tri[2]]);
      lines.push([tri[2], tri[0]]);
    }

    const lineBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuf);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(lines.flat()),
      gl.STATIC_DRAW
    );

    const viewportWidthUniformLoc = gl.getUniformLocation(
      program,
      "viewportWidth"
    );
    const viewportHeightUniformLoc = gl.getUniformLocation(
      program,
      "viewportHeight"
    );
    const colorUniformLoc = gl.getUniformLocation(program, "color");

    return (
      color: [number, number, number, number],
      transform?: Transform,
      eventHandler?: EventHander,
      debug = false
    ) => {
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      gl.uniform1f(viewportWidthUniformLoc, this.gl.canvas.width);
      gl.uniform1f(viewportHeightUniformLoc, this.gl.canvas.height);
      gl.uniform4fv(colorUniformLoc, new Float32Array(color));
      if (debug) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuf);
        // gl.drawElements(gl.LINES, lines.length * 2, gl.UNSIGNED_SHORT, 0);
        gl.drawArrays(gl.POINTS, 0, vertices.length++);
      } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuf);
        gl.drawElements(
          gl.TRIANGLES,
          triangles.length * 3,
          gl.UNSIGNED_SHORT,
          0
        );
      }
      this.interactive.unshift({ polygon, eventHandler });
    };
  }
}

function compileShader(
  gl: WebGL2RenderingContext,
  shaderSource: string,
  shaderType:
    | WebGL2RenderingContext["VERTEX_SHADER"]
    | WebGL2RenderingContext["FRAGMENT_SHADER"]
): WebGLShader {
  const shader = gl.createShader(shaderType)!;
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}

function createWebGLProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER
  );

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    throw "program failed to link:" + gl.getProgramInfoLog(program);
  }

  return program;
}
