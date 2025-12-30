/**
 * WebGPUサポート検証ユーティリティ
 * 詳細なWebGPUサポート状況をチェックし、デバッグ情報を提供
 */

export interface WebGPUSupportInfo {
  navigatorGpuExists: boolean;
  requestAdapterSuccess: boolean;
  adapterNotNull: boolean;
  requestDeviceSuccess: boolean;
  contextAvailable: boolean;
  contextConfigureSuccess: boolean;
  preferredFormat: string | null;
  errorMessage: string | null;
  userAgent: string;
  platform: string;
  isMobile: boolean;
  adapterInfo?: {
    vendor?: string;
    architecture?: string;
    device?: string;
    description?: string;
  };
}

/**
 * WebGPUサポートの詳細チェックを実行
 */
export async function checkWebGPUSupportDetailed(): Promise<WebGPUSupportInfo> {
  const info: WebGPUSupportInfo = {
    navigatorGpuExists: false,
    requestAdapterSuccess: false,
    adapterNotNull: false,
    requestDeviceSuccess: false,
    contextAvailable: false,
    contextConfigureSuccess: false,
    preferredFormat: null,
    errorMessage: null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  };

  try {
    // Step 1: navigator.gpu の存在確認
    console.log("🔍 Step 1: Checking navigator.gpu existence...");
    info.navigatorGpuExists = !!navigator.gpu;
    if (!info.navigatorGpuExists) {
      info.errorMessage = "navigator.gpu is not available";
      console.log("❌ Step 1 failed: navigator.gpu is not available");
      return info;
    }
    console.log("✅ Step 1 passed: navigator.gpu exists");

    // Step 2: getPreferredCanvasFormat の確認
    console.log("🔍 Step 2: Checking getPreferredCanvasFormat...");
    try {
      info.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
      console.log(`✅ Step 2 passed: preferredFormat = ${info.preferredFormat}`);
    } catch (e) {
      info.errorMessage = `getPreferredCanvasFormat failed: ${e}`;
      console.log("❌ Step 2 failed:", info.errorMessage);
      return info;
    }

    // Step 3: requestAdapter の確認
    console.log("🔍 Step 3: Checking requestAdapter...");
    let adapter: GPUAdapter | null = null;
    try {
      adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
      });
      info.requestAdapterSuccess = true;
      info.adapterNotNull = adapter !== null;

      if (!adapter) {
        info.errorMessage = "requestAdapter returned null";
        console.log("❌ Step 3 failed: requestAdapter returned null");
        return info;
      }

      // アダプター情報を取得（可能な場合）
      try {
        // requestAdapterInfo は実験的なAPIなので、型アサーションを使用
        const adapterWithInfo = adapter as any;
        if (adapterWithInfo.requestAdapterInfo) {
          const adapterInfo = await adapterWithInfo.requestAdapterInfo();
          if (adapterInfo) {
            info.adapterInfo = {
              vendor: adapterInfo.vendor,
              architecture: adapterInfo.architecture,
              device: adapterInfo.device,
              description: adapterInfo.description,
            };
          }
        }
      } catch (e) {
        // requestAdapterInfo は実験的な機能なので、失敗しても続行
        console.log("ℹ️ requestAdapterInfo not available or failed:", e);
      }

      console.log("✅ Step 3 passed: adapter obtained");
      if (info.adapterInfo) {
        console.log("📊 Adapter info:", info.adapterInfo);
      }
    } catch (e) {
      info.errorMessage = `requestAdapter failed: ${e}`;
      console.log("❌ Step 3 failed:", info.errorMessage);
      return info;
    }

    // Step 4: requestDevice の確認
    console.log("🔍 Step 4: Checking requestDevice...");
    try {
      const testDevice = await adapter.requestDevice();
      info.requestDeviceSuccess = true;
      console.log("✅ Step 4 passed: device obtained");
      testDevice.destroy(); // テスト用デバイスは破棄
    } catch (e) {
      info.errorMessage = `requestDevice failed: ${e}`;
      console.log("❌ Step 4 failed:", info.errorMessage);
      return info;
    }

    // Step 5: Canvas context の確認（実際の canvas が必要）
    console.log("🔍 Step 5: Checking canvas context...");
    const canvas = document.querySelector<HTMLCanvasElement>("#app");
    if (canvas) {
      try {
        const context = canvas.getContext("webgpu");
        info.contextAvailable = context !== null;

        if (context) {
          console.log("✅ Step 5 passed: WebGPU context obtained");
          
          // Step 6: Context configuration のテスト
          console.log("🔍 Step 6: Testing context configuration...");
          try {
            // 実際のデバイスで設定をテスト
            const realAdapter = await navigator.gpu.requestAdapter({
              powerPreference: "high-performance",
            });
            if (realAdapter) {
              const realDevice = await realAdapter.requestDevice();
              context.configure({
                device: realDevice,
                format: info.preferredFormat as GPUTextureFormat,
                alphaMode: "opaque",
              });
              info.contextConfigureSuccess = true;
              console.log("✅ Step 6 passed: context configuration successful");
              realDevice.destroy();
            }
          } catch (e) {
            info.errorMessage = `context.configure failed: ${e}`;
            console.log("❌ Step 6 failed:", info.errorMessage);
            return info;
          }
        } else {
          info.errorMessage = "getContext('webgpu') returned null";
          console.log("❌ Step 5 failed: getContext('webgpu') returned null");
        }
      } catch (e) {
        info.errorMessage = `getContext('webgpu') failed: ${e}`;
        console.log("❌ Step 5 failed:", info.errorMessage);
      }
    } else {
      console.log("⚠️ Step 5 skipped: canvas element not found");
    }

    return info;
  } catch (error) {
    info.errorMessage = `Unexpected error: ${error}`;
    console.log("❌ Unexpected error:", error);
    return info;
  }
}

/**
 * WebGPUサポート情報を人間が読みやすい形式でフォーマット
 */
export function formatWebGPUSupportInfo(info: WebGPUSupportInfo): string {
  const lines = [
    "🔍 WebGPU Support Details:",
    `navigator.gpu: ${info.navigatorGpuExists ? "✅" : "❌"}`,
    `requestAdapter: ${info.requestAdapterSuccess ? "✅" : "❌"}`,
    `adapter: ${info.adapterNotNull ? "✅" : "❌"}`,
    `requestDevice: ${info.requestDeviceSuccess ? "✅" : "❌"}`,
    `context: ${info.contextAvailable ? "✅" : "❌"}`,
    `configure: ${info.contextConfigureSuccess ? "✅" : "❌"}`,
    `format: ${info.preferredFormat || "N/A"}`,
    `error: ${info.errorMessage || "None"}`,
    "",
    "🌐 Environment:",
    `Platform: ${info.platform}`,
    `Mobile: ${info.isMobile ? "Yes" : "No"}`,
    `User Agent: ${info.userAgent}`,
  ];

  if (info.adapterInfo) {
    lines.push(
      "",
      "🎮 GPU Adapter Info:",
      `Vendor: ${info.adapterInfo.vendor || "Unknown"}`,
      `Architecture: ${info.adapterInfo.architecture || "Unknown"}`,
      `Device: ${info.adapterInfo.device || "Unknown"}`,
      `Description: ${info.adapterInfo.description || "Unknown"}`
    );
  }

  return lines.join("\n");
}

/**
 * 段階的なWebGPUサポートチェック（簡易版）
 */
export async function checkWebGPUSupport(): Promise<{
  supported: boolean;
  stage: string;
  error?: string;
}> {
  // Step 1: navigator.gpu
  if (!navigator.gpu) {
    return {
      supported: false,
      stage: "navigator.gpu",
      error: "navigator.gpu is not available",
    };
  }

  try {
    // Step 2: requestAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        stage: "requestAdapter",
        error: "requestAdapter returned null",
      };
    }

    // Step 3: requestDevice
    const device = await adapter.requestDevice();
    device.destroy();

    // Step 4: context (optional)
    const canvas = document.querySelector<HTMLCanvasElement>("#app");
    if (canvas) {
      const context = canvas.getContext("webgpu");
      if (!context) {
        return {
          supported: false,
          stage: "getContext",
          error: "getContext('webgpu') returned null",
        };
      }
    }

    return { supported: true, stage: "complete" };
  } catch (error) {
    return {
      supported: false,
      stage: "unknown",
      error: String(error),
    };
  }
}
