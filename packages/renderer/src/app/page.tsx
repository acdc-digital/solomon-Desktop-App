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
    // This vertex shader updates particle positions using transform feedback.
    // It samples the precomputed flow texture to get a force direction and multiplies it
    // by the sampled edge strength (stored in the alpha channel) for dynamic attraction.
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
        // Sample the flow texture.
        vec4 texSample = texture(uFlowTexture, uv);
        // Convert red and green channels to flow direction in [-1,1].
        vec2 flow = texSample.rg * 2.0 - 1.0;
        // The alpha channel carries the edge strength (in [0,1]).
        float edgeStrength = texSample.a;
        
        // Update velocity: add the flow scaled by deltaTime, base flow strength, and edge strength.
        vec2 newVelocity = aVelocity + flow * uDeltaTime * ${FLOW_STRENGTH.toFixed(3)} * edgeStrength;
        // Apply friction.
        newVelocity *= ${FRICTION.toFixed(3)};
        // Update position.
        vec2 newPosition = aPosition + newVelocity * uDeltaTime;
        
        // Wrap around screen boundaries.
        if(newPosition.x < 0.0) newPosition.x += uResolution.x;
        if(newPosition.x > uResolution.x) newPosition.x -= uResolution.x;
        if(newPosition.y < 0.0) newPosition.y += uResolution.y;
        if(newPosition.y > uResolution.y) newPosition.y -= uResolution.y;
        
        vPosition = newPosition;
        vVelocity = newVelocity;
      }
    `;
    // Dummy fragment shader (not used during transform feedback).
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
        // Convert from pixel space to clip space.
        vec2 clipSpace = (aPosition / uResolution) * 2.0 - 1.0;
        // Flip y-axis to account for WebGL clip space.
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

    // --- Create Transform Feedback Object ---
    const tf = gl.createTransformFeedback();
    if (!tf) throw new Error("Could not create transform feedback");
    this.transformFeedback = tf;

    // --- Initialize Particle Buffers and VAOs ---
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

    // Create two sets of buffers for ping-ponging.
    for (let i = 0; i < 2; i++) {
      // Position buffer.
      const posBuffer = gl.createBuffer();
      if (!posBuffer) throw new Error("Failed to create position buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, initialPositions, gl.DYNAMIC_COPY);
      this.positionBuffers.push(posBuffer);

      // Velocity buffer.
      const velBuffer = gl.createBuffer();
      if (!velBuffer) throw new Error("Failed to create velocity buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, initialVelocities, gl.DYNAMIC_COPY);
      this.velocityBuffers.push(velBuffer);

      // Create VAO for this buffer set.
      const vao = gl.createVertexArray();
      if (!vao) throw new Error("Failed to create VAO");
      gl.bindVertexArray(vao);
      // Bind position attribute (location 0).
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      // Bind velocity attribute (location 1).
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
    // Set uniforms.
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
  
    // Bind the VAO for the current reading buffer.
    gl.bindVertexArray(this.vaos[this.currentBufferIndex]);
    // Unbind ARRAY_BUFFER to avoid conflicts with transform feedback.
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
  
    // Swap buffers.
    this.currentBufferIndex = nextBufferIndex;
  
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
  }

  public render() {
    const gl = this.gl;
    gl.useProgram(this.renderProgram);
    // Set uniforms.
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
  // Vertex shader: draws a full-screen quad with a scaling uniform.
  const vsSource = `#version 300 es
    precision highp float;
    layout(location = 0) in vec2 aPosition;
    uniform vec2 uOverlayScale;
    out vec2 vUV;
    void main() {
      // Scale the quad to preserve the image aspect ratio.
      vec2 pos = aPosition * uOverlayScale;
      gl_Position = vec4(pos, 0.0, 1.0);
      // Compute UV from aPosition in clip space, then flip vertically.
      vUV = vec2((aPosition.x + 1.0) * 0.5, 1.0 - ((aPosition.y + 1.0) * 0.5));
    }
  `;
  // Fragment shader: samples the overlay texture and outputs a semi-transparent white modulated by the texture's alpha.
  const fsSource = `#version 300 es
    precision highp float;
    in vec2 vUV;
    uniform sampler2D uOverlayTexture;
    uniform float uOverlayOpacity;
    out vec4 fragColor;
    void main() {
      vec4 texColor = texture(uOverlayTexture, vUV);
      // Use the alpha channel (edge strength) as intensity.
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
  // Two triangles covering the full clip space.
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
    // Get canvas and WebGL2 context.
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL2 not supported.");
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Load the image from the public directory.
    const image = new Image();
    image.src = "/genie-stock.png"; // Using the image from your public folder.
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      // Create an offscreen canvas to compute the flow field from the image using Sobel edge detection.
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

      // Prepare Sobel kernels.
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

      // Compute a flow field and pack it into a Uint8Array.
      // For each pixel, compute the gradient magnitude using the Sobel operator,
      // then compute an angle from the strength, and finally compute a flow vector = (cos(angle), sin(angle)).
      // Map each component from [-1,1] to [0,255] for R and G channels.
      // Also store the normalized edge magnitude in the A channel so that strong edges boost particle attraction.
      const flowData = new Uint8Array(imgWidth * imgHeight * 4);
      for (let y = 0; y < imgHeight; y++) {
        for (let x = 0; x < imgWidth; x++) {
          let gx = 0;
          let gy = 0;
          // Apply the Sobel filter.
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const px = x + kx;
              const py = y + ky;
              // Handle boundary conditions.
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
          // Compute angle based on strength.
          const angle = (strength / 255) * Math.PI * 2;
          const flowX = Math.cos(angle);
          const flowY = Math.sin(angle);
          // Map from [-1,1] to [0,255] for flow direction.
          const mappedX = Math.floor((flowX + 1) / 2 * 255);
          const mappedY = Math.floor((flowY + 1) / 2 * 255);
          // Normalize edge strength to [0,1] and then to [0,255] for storage.
          const normStrength = Math.min(strength / 255, 1.0);
          const mappedAlpha = Math.floor(normStrength * 255);
          const index = (y * imgWidth + x) * 4;
          flowData[index] = mappedX;
          flowData[index + 1] = mappedY;
          flowData[index + 2] = 0;
          flowData[index + 3] = mappedAlpha;
        }
      }

      // Create a WebGL texture from the flow data.
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

      // Instantiate the ParticleSystem with the computed flow texture.
      const particleSystem = new ParticleSystem(gl, PARTICLE_COUNT, flowTexture);

      // Create overlay program and full-screen quad buffer.
      const overlayProgram = createOverlayProgram(gl);
      const quadBuffer = createFullScreenQuadBuffer(gl);
      const overlayPosLoc = gl.getAttribLocation(overlayProgram, "aPosition");

      // --- Render Loop ---
      let lastTime = performance.now();
      function renderLoop() {
        const now = performance.now();
        const deltaTime = now - lastTime;
        lastTime = now;
        
        // Update the particle system.
        particleSystem.update(deltaTime);
        
        // Enable blending for trailing effect.
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // Clear with a low alpha value for smooth trails.
        gl.clearColor(0.11, 0.11, 0.11, 0.05);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Render the particles.
        particleSystem.render();
        
        // Render the overlay (edge map) as a semi-transparent textured quad.
        gl.useProgram(overlayProgram);
        // Compute overlay scale to preserve image aspect ratio and center the image.
        const canvasAspect = gl.canvas.width / gl.canvas.height;
        const imageAspect = imgWidth / imgHeight;
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (canvasAspect > imageAspect) {
          // Canvas is wider than image: scale down X.
          scaleX = imageAspect / canvasAspect;
        } else {
          // Canvas is taller than image: scale down Y.
          scaleY = canvasAspect / imageAspect;
        }
        const uOverlayScaleLoc = gl.getUniformLocation(overlayProgram, "uOverlayScale");
        if (uOverlayScaleLoc) {
          gl.uniform2f(uOverlayScaleLoc, scaleX, scaleY);
        }
        
        // Bind the quad buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(overlayPosLoc);
        gl.vertexAttribPointer(overlayPosLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Bind the flow texture as the overlay texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowTexture);
        const overlayTexLoc = gl.getUniformLocation(overlayProgram, "uOverlayTexture");
        const overlayOpacityLoc = gl.getUniformLocation(overlayProgram, "uOverlayOpacity");
        if (overlayTexLoc) gl.uniform1i(overlayTexLoc, 0);
        if (overlayOpacityLoc) gl.uniform1f(overlayOpacityLoc, OVERLAY_OPACITY);
        
        // Draw the full-screen quad.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(overlayPosLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // Continue the loop.
        requestAnimationFrame(renderLoop);
      }
      renderLoop();
    };

    // Handle window resize.
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