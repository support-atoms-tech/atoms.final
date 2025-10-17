//#region next.config.ts
const nextConfig = {
	experimental: { reactCompiler: true },
	images: { domains: ["lh3.googleusercontent.com"] },
	eslint: { ignoreDuringBuilds: true }
};
var next_config_default = nextConfig;

//#endregion
export { next_config_default as default };