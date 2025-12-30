// import Stats from "stats.js";
import { Device } from "../core/Device";
import { Renderer } from "../core/Renderer";
import { attachResize, sizeCanvas } from "./resize";
import { createAssets } from "../gfx/createAssets";
import { Scene } from "../scene/Scene";
import { Gui } from "../utils/Gui";
import {
  checkWebGPUSupportDetailed,
  formatWebGPUSupportInfo,
  checkWebGPUSupport,
  type WebGPUSupportInfo,
} from "../utils/WebGPUSupport";

export async function bootstrap() {
  const canvas = document.querySelector<HTMLCanvasElement>("#app");
  if (!canvas) {
    await showWebGPUError(null, "Canvas element not found");
    return;
  }

  sizeCanvas(canvas);

  // 詳細なWebGPUサポートチェックを実行
  console.log("🚀 Starting WebGPU support verification...");
  const supportCheck = await checkWebGPUSupport();

  if (!supportCheck.supported) {
    console.log(
      `❌ WebGPU support check failed at stage: ${supportCheck.stage}`
    );
    console.log(`Error: ${supportCheck.error}`);

    // 詳細情報を取得してエラー画面に表示
    const detailedInfo = await checkWebGPUSupportDetailed();
    await showWebGPUError(detailedInfo, supportCheck.error);
    return;
  }

  console.log("✅ WebGPU support verification passed");

  try {
    //setup
    const { device, context, format } = await Device.init(canvas);

    //create assets
    const { fullscreenPlane, resolutionSystem, timeStep, uniforms } =
      createAssets(device, format, canvas);

    //create scene
    const scene = new Scene(fullscreenPlane);

    //gui
    new Gui(uniforms);

    const renderer = new Renderer(
      device,
      context,
      canvas,
      scene,
      resolutionSystem
    );
    await renderer.init();

    attachResize(canvas, (w, h) => {
      renderer.onResize(w, h);
    });

    // const stats = new Stats();
    // stats.showPanel(0);
    // document.body.appendChild(stats.dom);
    let last = 0;
    let totalTime = 0;

    const loop = (t: number) => {
      // stats?.begin();
      const dt = t - last;
      last = t;

      totalTime += dt;
      timeStep.set(totalTime);

      last = t;
      renderer.update();
      renderer.render();

      // stats?.end();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (error) {
    console.log("❌ Application initialization failed:", error);

    // 初期化エラーの場合も詳細情報を取得
    const detailedInfo = await checkWebGPUSupportDetailed();
    await showWebGPUError(
      detailedInfo,
      `Application initialization failed: ${error}`
    );
    return;
  }
}

async function showWebGPUError(
  supportInfo?: WebGPUSupportInfo | null,
  customError?: string
) {
  const errorElement = document.getElementById("webgpu-error");
  const canvas = document.querySelector<HTMLCanvasElement>("#app");
  const debugDetails = document.getElementById("debug-details");

  if (errorElement) {
    errorElement.style.display = "flex";
  }
  if (canvas) {
    canvas.style.display = "none";
  }

  // デバッグ情報を設定
  if (debugDetails) {
    let debugInfo = "";

    if (supportInfo) {
      debugInfo = formatWebGPUSupportInfo(supportInfo);
    } else {
      // supportInfo が null の場合は基本情報のみ
      debugInfo = [
        "🔍 WebGPU Support Details:",
        `Error: ${customError || "Unknown error"}`,
        "",
        "🌐 Environment:",
        `Platform: ${navigator.platform}`,
        `User Agent: ${navigator.userAgent}`,
        `Mobile: ${
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Yes" : "No"
        }`,
      ].join("\n");
    }

    if (customError && supportInfo) {
      debugInfo += `\n\n⚠️ Additional Error: ${customError}`;
    }

    debugDetails.textContent = debugInfo;
    console.log(debugInfo);
  }
}
