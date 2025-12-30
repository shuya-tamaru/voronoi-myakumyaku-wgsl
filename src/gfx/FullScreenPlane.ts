import { createFullscreenQuad } from "./createFullscreenQuad";
import fullscreenShader from "../shaders/fullscreen.wgsl";
import type { ResolutionSystem } from "../utils/ResolutionSystem";
import type { MouseSystem } from "../utils/MouseSystem";
import type { TimeStep } from "../utils/TimeStep";
import type { Uniforms } from "../utils/Uniforms";

export class FullScreenPlane {
  private device: GPUDevice;
  private format: GPUTextureFormat;
  private pipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private bindGroupLayout!: GPUBindGroupLayout;

  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private indexCount!: number;
  private resolutionSystem!: ResolutionSystem;
  private mouseSystem!: MouseSystem;
  private timeStep!: TimeStep;
  private uniforms!: Uniforms;

  constructor(
    device: GPUDevice,
    format: GPUTextureFormat,
    resolutionSystem: ResolutionSystem,
    mouseSystem: MouseSystem,
    timeStep: TimeStep,
    uniforms: Uniforms
  ) {
    this.device = device;
    this.format = format;
    this.resolutionSystem = resolutionSystem;
    this.mouseSystem = mouseSystem;
    this.timeStep = timeStep;
    this.uniforms = uniforms;
    this.init();
  }

  init() {
    const geo = createFullscreenQuad(this.device);
    this.vertexBuffer = geo.vertexBuffer;
    this.indexBuffer = geo.indexBuffer;
    this.indexCount = geo.indexCount;

    const module = this.device.createShaderModule({
      code: fullscreenShader,
    });

    // 明示的なbind group layoutを定義
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module, entryPoint: "vs_main", buffers: [geo.layout] },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-list" },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.resolutionSystem.getBuffer() },
        },
        {
          binding: 1,
          resource: { buffer: this.mouseSystem.getBuffer() },
        },
        {
          binding: 2,
          resource: { buffer: this.uniforms.getBuffer() },
        },
        {
          binding: 3,
          resource: { buffer: this.timeStep.getBuffer() },
        },
      ],
    });
  }

  draw(pass: GPURenderPassEncoder) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount);
  }
}
