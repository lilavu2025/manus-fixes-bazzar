import configMap from "./configMap";
import defaultConfig from "./defaultConfig";

const clientKey = import.meta.env.VITE_CLIENT_KEY;
const config = configMap[clientKey] || defaultConfig;

export default config;
