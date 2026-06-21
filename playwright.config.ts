import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env['CI']
	},
	projects: [
		{
			name: 'desktop',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 720 }
			}
		}
	]
});
