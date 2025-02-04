// HomePage
// /packages/renderer/src/app/page.tsx

'use client'

import { useEffect, useRef } from "react";

// --------------------
// Adjustable Parameters
// --------------------
const PARTICLE_COUNT = 1000;         // Total number of particles
const FLOW_STRENGTH = 0.5;           // With no image flow, set flow strength to zero.
const FRICTION = 1;               // Friction applied each update (values less than 1 slow particles over time)
const BACKGROUND_COLOR = "#1b1b1b";  // Background color

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

  constructor(
    gl: WebGL2RenderingContext,
    particleCount: number,
    flowTexture: WebGLTexture
  ) {
    this.gl = gl;
    this.particleCount = particleCount;
    this.flowTexture = flowTexture;

    // --- Setup Update Program ---
    // The update shader now samples a constant flow texture.
    // With FLOW_STRENGTH set to 0, no additional force is applied.
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
        // Normalize particle position to [0,1] for texture lookup.
        vec2 uv = aPosition / uResolution;
        vec4 texSample = texture(uFlowTexture, uv);
        // Convert red and green channels to flow direction in [-1,1].
        vec2 flow = texSample.rg * 2.0 - 1.0;
        // With no dynamic flow, FLOW_STRENGTH is 0 so the force is zero.
        float edgeStrength = texSample.a;
        
        vec2 newVelocity = aVelocity + flow * uDeltaTime * ${FLOW_STRENGTH.toFixed(
      3
    )} * edgeStrength;
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
// Create a Constant Flow Texture
// --------------------
function createConstantFlowTexture(gl: WebGL2RenderingContext): WebGLTexture {
  // Create a 1x1 texture whose RG channels are 0.5 (which maps to a flow vector of (0,0))
  // and whose alpha is 1.0.
  const pixel = new Uint8Array([128, 128, 0, 255]); // 128/255 = 0.5, 255 means full strength.
  const texture = gl.createTexture();
  if (!texture) throw new Error("Failed to create constant flow texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixel
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
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
    const gl = glRaw; // Assert non-null
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Create a constant flow texture (no image, no border).
    const flowTexture = createConstantFlowTexture(gl);

    // Instantiate the ParticleSystem.
    const particleSystem = new ParticleSystem(gl, PARTICLE_COUNT, flowTexture);

    // No overlay rendering code since we are removing the genie image and border.

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
      
      requestAnimationFrame(renderLoop);
    }
    renderLoop();

    const resizeHandler = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <div
      style={{
        backgroundColor: BACKGROUND_COLOR,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}