import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: "loose",
    externalDir: true,
  },
  transpilePackages: [
    "@repo/design-engine",
    "@repo/generation-engine",
    "konva",
    "react-konva",
  ],
  webpack: (config, { webpack }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
      "konva$": "konva/lib/index.js",
      "konva/lib/index-node": path.resolve("./config/konva-node-stub.js"),
      "konva/lib/index-node.js": path.resolve("./config/konva-node-stub.js"),
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      canvas: false,
    };
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
      }),
    );
    return config;
  },
};

export default nextConfig;



