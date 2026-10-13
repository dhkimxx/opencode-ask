// Compiles the Solid JSX ahead of time. OpenCode only transforms plugin JSX outside node_modules,
// so installs from npm or GitHub need plain JavaScript. The host provides every external below.
import solid from "@opentui/solid/bun-plugin"

const result = await Bun.build({
  entrypoints: ["./src/tui.tsx"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  external: ["@opencode/plugin", "@opencode/plugin/*", "@opentui/core", "@opentui/solid", "solid-js", "solid-js/*"],
  plugins: [solid],
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

for (const output of result.outputs) console.log(output.path)
