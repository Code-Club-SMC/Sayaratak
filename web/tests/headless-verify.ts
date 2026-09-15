import { chromium } from "playwright";

async function main() {
	console.log("[1/6] Launching headless Chromium...");
	const browser = await chromium.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
	});
	const page = await context.newPage();

	const consoleErrors: string[] = [];
	const consoleWarnings: string[] = [];
	const pageErrors: string[] = [];

	page.on("console", (msg) => {
		const text = msg.text();
		if (msg.type() === "error") {
			consoleErrors.push(`[CONSOLE ERROR] ${text}`);
		} else if (msg.type() === "warning" && text.includes("hydration")) {
			consoleWarnings.push(`[HYDRATION WARNING] ${text}`);
		}
	});

	page.on("pageerror", (err) => {
		pageErrors.push(`[PAGE ERROR] ${err.message}\n${err.stack || ""}`);
	});

	// 1. Test Root Redirect
	console.log("[2/6] Navigating to http://localhost:3000/ (root redirect)...");
	const resRoot = await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
	const finalUrl = page.url();
	console.log(`      Status: ${resRoot?.status()}, Final URL: ${finalUrl}`);

	// 2. Test English Page Hydration
	console.log("[3/6] Navigating to http://localhost:3000/en ...");
	await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
	await page.waitForTimeout(500); // allow hydration to settle

	const enLang = await page.getAttribute("html", "lang");
	const enDir = await page.getAttribute("html", "dir");
	const enTitle = await page.title();
	const enHeaderVisible = await page.locator("header").isVisible();
	const enFooterVisible = await page.locator("footer").isVisible();

	console.log(`      HTML lang="${enLang}", dir="${enDir}"`);
	console.log(`      Page title: "${enTitle}"`);
	console.log(`      Header visible: ${enHeaderVisible}, Footer visible: ${enFooterVisible}`);

	// 3. Test Arabic Page Hydration
	console.log("[4/6] Navigating to http://localhost:3000/ar ...");
	await page.goto("http://localhost:3000/ar", { waitUntil: "networkidle" });
	await page.waitForTimeout(500);

	const arLang = await page.getAttribute("html", "lang");
	const arDir = await page.getAttribute("html", "dir");
	const arTitle = await page.title();
	const arHeaderVisible = await page.locator("header").isVisible();
	const arFooterVisible = await page.locator("footer").isVisible();

	console.log(`      HTML lang="${arLang}", dir="${arDir}"`);
	console.log(`      Page title: "${arTitle}"`);
	console.log(`      Header visible: ${arHeaderVisible}, Footer visible: ${arFooterVisible}`);

	// 4. Test Client-Side Locale Switcher Click
	console.log("[5/6] Testing interactive Locale Switcher click on client...");
	const switcherBtn = page.locator("header button").filter({ hasText: /English|العربية/ }).first();
	if (await switcherBtn.isVisible()) {
		await switcherBtn.click();
		await page.waitForTimeout(500);
		console.log(`      URL after clicking switcher: ${page.url()}`);
		console.log(`      HTML dir after switch: ${await page.getAttribute("html", "dir")}`);
	} else {
		console.log("      Switcher button not found in header");
	}

	// 5. Test Login Form Hydration
	console.log("[6/6] Navigating to http://localhost:3000/en/login ...");
	await page.goto("http://localhost:3000/en/login", { waitUntil: "networkidle" });
	await page.waitForTimeout(500);
	const emailInputVisible = await page.locator('input[type="email"]').isVisible();
	const passwordInputVisible = await page.locator('input[type="password"]').isVisible();
	console.log(`      Email input visible: ${emailInputVisible}, Password input visible: ${passwordInputVisible}`);

	// Summary Results
	console.log("\n==================================================");
	console.log("           HEADLESS BROWSER AUDIT REPORT           ");
	console.log("==================================================");
	console.log(`Total Page Errors:      ${pageErrors.length}`);
	console.log(`Total Console Errors:   ${consoleErrors.length}`);
	console.log(`Hydration Warnings:     ${consoleWarnings.length}`);

	if (pageErrors.length > 0) {
		console.log("\nPage Errors Detail:");
		for (const e of pageErrors) console.error(" -", e);
	}
	if (consoleErrors.length > 0) {
		console.log("\nConsole Errors Detail:");
		for (const e of consoleErrors) console.error(" -", e);
	}
	if (consoleWarnings.length > 0) {
		console.log("\nHydration Warnings Detail:");
		for (const w of consoleWarnings) console.warn(" -", w);
	}

	const passed = pageErrors.length === 0 && consoleErrors.length === 0 && consoleWarnings.length === 0;
	console.log(`\nOVERALL STATUS: ${passed ? "PASSED (100% HEALTHY)" : "FAILED (ISSUES DETECTED)"}`);
	console.log("==================================================");

	await browser.close();
	if (!passed) {
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("Fatal test runner error:", err);
	process.exit(1);
});
