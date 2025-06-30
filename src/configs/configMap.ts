import defaultConfig from "./defaultConfig";
import zgayerStore from "./users-configs/zgayer-store";
// import client2 from "./users-configs/client2";

const configMap: Record<string, any> = {
  "zgayer-store": zgayerStore,
  // "client2": client2,
};

export { configMap, defaultConfig };
