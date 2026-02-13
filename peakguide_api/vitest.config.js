import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			reportsDirectory: "./coverage",
			setupFiles: ["./test/setup.js"],
			fileParallelism: false, // wyłącza równoległość plików
		},
		sequence: {
			concurrent: false, // <- najważniejsze
		},
	},
});
