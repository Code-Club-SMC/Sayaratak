import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		// tanstackStart MUST come before react()
		tanstackStart(),
		tailwindcss(),
		viteReact(),
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
});
