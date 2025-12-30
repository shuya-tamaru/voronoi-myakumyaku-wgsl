export class Device {
  static async init(canvas: HTMLCanvasElement) {
    console.log("🔧 Device.init: Starting WebGPU device initialization...");
    
    // Step 1: navigator.gpu チェック
    if (!navigator.gpu) {
      const error = "navigator.gpu is not available - WebGPU is not supported in this browser";
      console.log("❌ Device.init Step 1 failed:", error);
      throw new Error(error);
    }
    console.log("✅ Device.init Step 1: navigator.gpu is available");

    // Step 2: requestAdapter
    console.log("🔧 Device.init Step 2: Requesting GPU adapter...");
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) {
      const error = "requestAdapter returned null - No compatible GPU adapter found";
      console.log("❌ Device.init Step 2 failed:", error);
      throw new Error(error);
    }
    console.log("✅ Device.init Step 2: GPU adapter obtained");

    // アダプター情報をログ出力（可能な場合）
    try {
      const adapterInfo = await adapter.requestAdapterInfo?.();
      if (adapterInfo) {
        console.log("📊 GPU Adapter Info:", {
          vendor: adapterInfo.vendor,
          architecture: adapterInfo.architecture,
          device: adapterInfo.device,
          description: adapterInfo.description,
        });
      }
    } catch (e) {
      console.log("ℹ️ Adapter info not available:", e);
    }

    // Step 3: requestDevice
    console.log("🔧 Device.init Step 3: Requesting GPU device...");
    let device: GPUDevice;
    try {
      device = await adapter.requestDevice();
      console.log("✅ Device.init Step 3: GPU device obtained");
    } catch (error) {
      const errorMsg = `requestDevice failed: ${error}`;
      console.log("❌ Device.init Step 3 failed:", errorMsg);
      throw new Error(errorMsg);
    }

    // Step 4: WebGPU context
    console.log("🔧 Device.init Step 4: Getting WebGPU context...");
    const context = canvas.getContext("webgpu");
    if (!context) {
      const error = "getContext('webgpu') returned null - WebGPU context not available";
      console.log("❌ Device.init Step 4 failed:", error);
      throw new Error(error);
    }
    console.log("✅ Device.init Step 4: WebGPU context obtained");

    // Step 5: Preferred format
    console.log("🔧 Device.init Step 5: Getting preferred canvas format...");
    let format: GPUTextureFormat;
    try {
      format = navigator.gpu.getPreferredCanvasFormat();
      console.log(`✅ Device.init Step 5: Preferred format = ${format}`);
    } catch (error) {
      const errorMsg = `getPreferredCanvasFormat failed: ${error}`;
      console.log("❌ Device.init Step 5 failed:", errorMsg);
      throw new Error(errorMsg);
    }

    // Step 6: Context configuration
    console.log("🔧 Device.init Step 6: Configuring context...");
    try {
      context.configure({
        device,
        format,
        alphaMode: "opaque",
      });
      console.log("✅ Device.init Step 6: Context configuration successful");
    } catch (error) {
      const errorMsg = `context.configure failed: ${error}`;
      console.log("❌ Device.init Step 6 failed:", errorMsg);
      throw new Error(errorMsg);
    }

    console.log("🎉 Device.init: All steps completed successfully");
    return { device, context, format };
  }
}
