export default (phase, { defaultConfig }) => {
  const env = process.env.NODE_ENV;
  /**
   * @type {import("next").NextConfig}
   */
  if (env === "production") {
    return {
      output: "export",
      assetPrefix: `${process.env.NEXT_PUBLIC_BASE_PATH}/ui/`,
      basePath: `${process.env.NEXT_PUBLIC_BASE_PATH}/ui`,
      distDir: "../ui",
    };
  } else {
    return {
      async rewrites() {
        return [
          {
            source: "/query",
            destination: "http://localhost:8080/query", // Proxy to Backend
          },
        ];
      },
    };
  }
};
