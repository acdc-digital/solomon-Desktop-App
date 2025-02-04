// HomePage
// /packages/renderer/src/app/page.tsx

'use client'

import { useEffect, useRef } from "react";

// --------------------
// Adjustable Parameters
// --------------------
const PARTICLE_COUNT = 1000;         // Total number of particles
const FLOW_STRENGTH = 0.5;           // Base multiplier applied to the flow (in the update shader)
const FRICTION = 1;                  // Friction (applied in shader)
const BACKGROUND_COLOR = "#1b1b1b";  // Background color
const OVERLAY_OPACITY = 0.5;         // Overall opacity for the edge overlay

// --------------------
// Helper Functions for Shader Compilation
// --------------------
function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + error);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  varyings?: string[]
): WebGLProgram {
  const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  if (varyings) {
    gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    throw new Error("Program linking error: " + error);
  }
  return program;
}

// --------------------
// Particle System Class using WebGL2 & Transform Feedback
// --------------------
class ParticleSystem {
  gl: WebGL2RenderingContext;
  particleCount: number;
  updateProgram: WebGLProgram;
  renderProgram: WebGLProgram;
  transformFeedback: WebGLTransformFeedback;
  currentBufferIndex: number = 0;
  positionBuffers: WebGLBuffer[] = [];
  velocityBuffers: WebGLBuffer[] = [];
  vaos: WebGLVertexArrayObject[] = [];
  flowTexture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext, particleCount: number, flowTexture: WebGLTexture) {
    this.gl = gl;
    this.particleCount = particleCount;
    this.flowTexture = flowTexture;

    // --- Setup Update Program ---
    const updateVertexSource = `#version 300 es
      precision highp float;
      layout(location = 0) in vec2 aPosition;
      layout(location = 1) in vec2 aVelocity;
      
      uniform float uDeltaTime;
      uniform vec2 uResolution;
      uniform sampler2D uFlowTexture;
      
      out vec2 vPosition;
      out vec2 vVelocity;
      
      void main() {
        vec2 uv = aPosition / uResolution;
        vec4 texSample = texture(uFlowTexture, uv);
        vec2 flow = texSample.rg * 2.0 - 1.0;
        float edgeStrength = texSample.a;
        
        vec2 newVelocity = aVelocity + flow * uDeltaTime * ${FLOW_STRENGTH.toFixed(3)} * edgeStrength;
        newVelocity *= ${FRICTION.toFixed(3)};
        vec2 newPosition = aPosition + newVelocity * uDeltaTime;
        
        if(newPosition.x < 0.0) newPosition.x += uResolution.x;
        if(newPosition.x > uResolution.x) newPosition.x -= uResolution.x;
        if(newPosition.y < 0.0) newPosition.y += uResolution.y;
        if(newPosition.y > uResolution.y) newPosition.y -= uResolution.y;
        
        vPosition = newPosition;
        vVelocity = newVelocity;
      }
    `;
    const dummyFragmentSource = `#version 300 es
      precision highp float;
      void main() { }
    `;
    this.updateProgram = createProgram(
      gl,
      updateVertexSource,
      dummyFragmentSource,
      ["vPosition", "vVelocity"]
    );

    // --- Setup Render Program ---
    const renderVertexSource = `#version 300 es
      precision highp float;
      layout(location = 0) in vec2 aPosition;
      uniform vec2 uResolution;
      void main() {
        vec2 clipSpace = (aPosition / uResolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `;
    const renderFragmentSource = `#version 300 es
      precision highp float;
      uniform vec3 uParticleColor;
      uniform float uParticleOpacity;
      out vec4 fragColor;
      void main() {
        fragColor = vec4(uParticleColor, uParticleOpacity);
      }
    `;
    this.renderProgram = createProgram(
      gl,
      renderVertexSource,
      renderFragmentSource
    );

    const tf = gl.createTransformFeedback();
    if (!tf) throw new Error("Could not create transform feedback");
    this.transformFeedback = tf;

    this.initBuffers();
  }

  private initBuffers() {
    const gl = this.gl;
    const initialPositions = new Float32Array(this.particleCount * 2);
    const initialVelocities = new Float32Array(this.particleCount * 2);
    const width = gl.canvas.width;
    const height = gl.canvas.height;
    for (let i = 0; i < this.particleCount; i++) {
      initialPositions[i * 2] = Math.random() * width;
      initialPositions[i * 2 + 1] = Math.random() * height;
      initialVelocities[i * 2] = (Math.random() - 0.5) * 50.0;
      initialVelocities[i * 2 + 1] = (Math.random() - 0.5) * 50.0;
    }

    for (let i = 0; i < 2; i++) {
      const posBuffer = gl.createBuffer();
      if (!posBuffer) throw new Error("Failed to create position buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, initialPositions, gl.DYNAMIC_COPY);
      this.positionBuffers.push(posBuffer);

      const velBuffer = gl.createBuffer();
      if (!velBuffer) throw new Error("Failed to create velocity buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, initialVelocities, gl.DYNAMIC_COPY);
      this.velocityBuffers.push(velBuffer);

      const vao = gl.createVertexArray();
      if (!vao) throw new Error("Failed to create VAO");
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      this.vaos.push(vao);
    }
    gl.bindVertexArray(null);
  }

  public update(deltaTime: number) {
    const gl = this.gl;
    gl.useProgram(this.updateProgram);
    const resolutionLoc = gl.getUniformLocation(this.updateProgram, "uResolution");
    const deltaTimeLoc = gl.getUniformLocation(this.updateProgram, "uDeltaTime");
    const flowTextureLoc = gl.getUniformLocation(this.updateProgram, "uFlowTexture");
    if (resolutionLoc) gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);
    if (deltaTimeLoc) gl.uniform1f(deltaTimeLoc, deltaTime / 1000.0);
    if (flowTextureLoc) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.flowTexture);
      gl.uniform1i(flowTextureLoc, 0);
    }
  
    gl.bindVertexArray(this.vaos[this.currentBufferIndex]);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);
    const nextBufferIndex = 1 - this.currentBufferIndex;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.positionBuffers[nextBufferIndex]);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.velocityBuffers[nextBufferIndex]);
  
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
  
    this.currentBufferIndex = nextBufferIndex;
  
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
  }

  public render() {
    const gl = this.gl;
    gl.useProgram(this.renderProgram);
    const resolutionLoc = gl.getUniformLocation(this.renderProgram, "uResolution");
    const colorLoc = gl.getUniformLocation(this.renderProgram, "uParticleColor");
    const opacityLoc = gl.getUniformLocation(this.renderProgram, "uParticleOpacity");
    if (resolutionLoc) gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);
    if (colorLoc) gl.uniform3f(colorLoc, 1.0, 1.0, 1.0);
    if (opacityLoc) gl.uniform1f(opacityLoc, 1.0);
  
    gl.bindVertexArray(this.vaos[this.currentBufferIndex]);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
    gl.bindVertexArray(null);
  }
}

// --------------------
// Overlay Rendering (Edge Map)
// --------------------
function createOverlayProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vsSource = `#version 300 es
    precision highp float;
    layout(location = 0) in vec2 aPosition;
    uniform vec2 uOverlayScale;
    out vec2 vUV;
    void main() {
      vec2 pos = aPosition * uOverlayScale;
      gl_Position = vec4(pos, 0.0, 1.0);
      vUV = vec2((aPosition.x + 1.0) * 0.5, 1.0 - ((aPosition.y + 1.0) * 0.5));
    }
  `;
  const fsSource = `#version 300 es
    precision highp float;
    in vec2 vUV;
    uniform sampler2D uOverlayTexture;
    uniform float uOverlayOpacity;
    out vec4 fragColor;
    void main() {
      vec4 texColor = texture(uOverlayTexture, vUV);
      float intensity = texColor.a;
      fragColor = vec4(vec3(1.0), intensity * uOverlayOpacity);
    }
  `;
  return createProgram(gl, vsSource, fsSource);
}

function createFullScreenQuadBuffer(gl: WebGL2RenderingContext): WebGLBuffer {
  const quadBuffer = gl.createBuffer();
  if (!quadBuffer) throw new Error("Failed to create quad buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  return quadBuffer;
}

// --------------------
// Next.js Home Component
// --------------------
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const glRaw = canvas.getContext("webgl2");
    if (!glRaw) {
      console.error("WebGL2 not supported.");
      return;
    }
    // Assert that gl is non-null.
    const gl = glRaw;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Load the image from the public directory.
    const image = new Image();
    image.src = "/genie-stock.png";
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = image.width;
      offCanvas.height = image.height;
      const offCtx = offCanvas.getContext("2d");
      if (!offCtx) return;
      offCtx.drawImage(image, 0, 0, image.width, image.height);
      const imageData = offCtx.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;
      const imgWidth = image.width;
      const imgHeight = image.height;

      const kernelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ];
      const kernelY = [
        [-1, -2, -1],
        [0,  0,  0],
        [1,  2,  1],
      ];

      const flowData = new Uint8Array(imgWidth * imgHeight * 4);
      for (let y = 0; y < imgHeight; y++) {
        for (let x = 0; x < imgWidth; x++) {
          let gx = 0;
          let gy = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const px = x + kx;
              const py = y + ky;
              const idx = (py * imgWidth + px) * 4;
              let r = 0, g = 0, b = 0;
              if (px >= 0 && py >= 0 && px < imgWidth && py < imgHeight) {
                r = data[idx];
                g = data[idx + 1];
                b = data[idx + 2];
              }
              const gray = (r + g + b) / 3;
              gx += gray * kernelX[ky + 1][kx + 1];
              gy += gray * kernelY[ky + 1][kx + 1];
            }
          }
          const strength = Math.sqrt(gx * gx + gy * gy);
          const angle = (strength / 255) * Math.PI * 2;
          const flowX = Math.cos(angle);
          const flowY = Math.sin(angle);
          const mappedX = Math.floor((flowX + 1) / 2 * 255);
          const mappedY = Math.floor((flowY + 1) / 2 * 255);
          const normStrength = Math.min(strength / 255, 1.0);
          const mappedAlpha = Math.floor(normStrength * 255);
          const index = (y * imgWidth + x) * 4;
          flowData[index] = mappedX;
          flowData[index + 1] = mappedY;
          flowData[index + 2] = 0;
          flowData[index + 3] = mappedAlpha;
        }
      }

      const flowTexture = gl.createTexture();
      if (!flowTexture) {
        console.error("Failed to create flow texture.");
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, flowTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        imgWidth,
        imgHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        flowData
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.bindTexture(gl.TEXTURE_2D, null);

      const particleSystem = new ParticleSystem(gl, PARTICLE_COUNT, flowTexture);

      const overlayProgram = createOverlayProgram(gl);
      const quadBuffer = createFullScreenQuadBuffer(gl);
      const overlayPosLoc = gl.getAttribLocation(overlayProgram, "aPosition");

      let lastTime = performance.now();
      function renderLoop() {
        const now = performance.now();
        const deltaTime = now - lastTime;
        lastTime = now;
        
        particleSystem.update(deltaTime);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.11, 0.11, 0.11, 0.05);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        particleSystem.render();
        
        gl.useProgram(overlayProgram);
        const canvasAspect = gl.canvas.width / gl.canvas.height;
        const imageAspect = imgWidth / imgHeight;
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (canvasAspect > imageAspect) {
          scaleX = imageAspect / canvasAspect;
        } else {
          scaleY = canvasAspect / imageAspect;
        }
        const uOverlayScaleLoc = gl.getUniformLocation(overlayProgram, "uOverlayScale");
        if (uOverlayScaleLoc) {
          gl.uniform2f(uOverlayScaleLoc, scaleX, scaleY);
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(overlayPosLoc);
        gl.vertexAttribPointer(overlayPosLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowTexture);
        const overlayTexLoc = gl.getUniformLocation(overlayProgram, "uOverlayTexture");
        const overlayOpacityLoc = gl.getUniformLocation(overlayProgram, "uOverlayOpacity");
        if (overlayTexLoc) gl.uniform1i(overlayTexLoc, 0);
        if (overlayOpacityLoc) gl.uniform1f(overlayOpacityLoc, OVERLAY_OPACITY);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(overlayPosLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        requestAnimationFrame(renderLoop);
      }
      renderLoop();
    };

    const resizeHandler = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <div style={{ backgroundColor: BACKGROUND_COLOR, height: "100vh", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}