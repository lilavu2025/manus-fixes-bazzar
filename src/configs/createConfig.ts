// src/configs/createConfig.ts
import defaultConfig from "./defaultConfig";

function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key in source) {
    if (
      Object.prototype.hasOwnProperty.call(source, key) &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      source[key] !== null
    ) {
      output[key] = deepMerge((target as any)[key] || {}, (source as any)[key]);
    } else {
      (output as any)[key] = (source as any)[key];
    }
  }
  return output;
}

export default function createConfig<T>(customConfig: Partial<T>): T {
  return deepMerge(defaultConfig as T, customConfig);
}
