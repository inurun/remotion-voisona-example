import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setVideoImageFormat("png");
Config.overrideWebpackConfig((currentConfiguration) => {
  const currentAlias =
    currentConfiguration.resolve?.alias && !Array.isArray(currentConfiguration.resolve.alias)
      ? currentConfiguration.resolve.alias
      : {};

  return enableTailwind({
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...currentAlias,
        "@": path.resolve(process.cwd(), "src"),
      },
    },
  });
});
