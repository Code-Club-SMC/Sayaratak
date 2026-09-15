import { GlobalWindow } from "happy-dom";

async function runHydrationAudit() {
	console.log("=== SAYARATAK HYDRATION & DOM AUDIT ===");

	const window = new GlobalWindow();
	const document = window.document;

	const capturedErrors: string[] = [];
	const capturedWarnings: string[] = [];

	// Intercept console messages
	const origError = console.error;
	const origWarn = console.warn;

	console.error = (...args: any[]) => {
		const str = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
		capturedErrors.push(str);
		origError(...args);
	};

	console.warn = (...args: any[]) => {
		const str = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
		if (str.toLowerCase().includes("hydration") || str.toLowerCase().includes("mismatch")) {
			capturedWarnings.push(str);
		}
		origWarn(...args);
	};

	try {
		// 1. Fetch live English SSR response
		console.log("\n[1/3] Fetching live English SSR stream from http://localhost:3000/en ...");
		const resEn = await fetch("http://localhost:3000/en", {
			headers: { "Accept-Encoding": "identity" },
		});
		const htmlEn = await resEn.text();

		console.log(`      Received HTML (${htmlEn.length} bytes). Loading into Happy DOM...`);
		document.write(htmlEn);

		const htmlElEn = document.querySelector("html");
		const langEn = htmlElEn?.getAttribute("lang");
		const dirEn = htmlElEn?.getAttribute("dir");
		const headerEn = document.querySelector("header");
		const footerEn = document.querySelector("footer");

		console.log(`      SSR Attributes: lang="${langEn}", dir="${dirEn}"`);
		console.log(`      Header element present: ${Boolean(headerEn)}`);
		console.log(`      Footer element present: ${Boolean(footerEn)}`);

		if (langEn !== "en" || dirEn !== "ltr") {
			throw new Error(`Expected English SSR to have lang="en" and dir="ltr", but got lang="${langEn}", dir="${dirEn}"`);
		}

		// 2. Fetch live Arabic SSR response
		console.log("\n[2/3] Fetching live Arabic SSR stream from http://localhost:3000/ar ...");
		const resAr = await fetch("http://localhost:3000/ar", {
			headers: { "Accept-Encoding": "identity" },
		});
		const htmlAr = await resAr.text();

		console.log(`      Received HTML (${htmlAr.length} bytes). Loading into Happy DOM...`);
		const windowAr = new GlobalWindow();
		windowAr.document.write(htmlAr);

		const htmlElAr = windowAr.document.querySelector("html");
		const langAr = htmlElAr?.getAttribute("lang");
		const dirAr = htmlElAr?.getAttribute("dir");
		const headerAr = windowAr.document.querySelector("header");
		const footerAr = windowAr.document.querySelector("footer");

		console.log(`      SSR Attributes: lang="${langAr}", dir="${dirAr}"`);
		console.log(`      Header element present: ${Boolean(headerAr)}`);
		console.log(`      Footer element present: ${Boolean(footerAr)}`);

		if (langAr !== "ar" || dirAr !== "rtl") {
			throw new Error(`Expected Arabic SSR to have lang="ar" and dir="rtl", but got lang="${langAr}", dir="${dirAr}"`);
		}

		// 3. Check for root redirect
		console.log("\n[3/3] Checking root route http://localhost:3000/ redirect...");
		const resRoot = await fetch("http://localhost:3000/", {
			redirect: "manual",
		});
		console.log(`      Status code: ${resRoot.status}, Location: ${resRoot.headers.get("location")}`);

		console.log("\n=== AUDIT RESULTS ===");
		console.log(`Hydration Warnings: ${capturedWarnings.length}`);
		console.log(`Console Errors:     ${capturedErrors.length}`);

		if (capturedWarnings.length > 0) {
			console.warn("\nHydration Warnings:", capturedWarnings);
		}
		if (capturedErrors.length > 0) {
			console.error("\nConsole Errors:", capturedErrors);
		}

		const success = capturedWarnings.length === 0 && capturedErrors.length === 0;
		console.log(`\nDOM AUDIT: ${success ? "SUCCESSFUL (ALL CHECKS PASSED)" : "FAILED"}`);
		return success;
	} finally {
		console.error = origError;
		console.warn = origWarn;
	}
}

runHydrationAudit()
	.then((ok) => process.exit(ok ? 0 : 1))
	.catch((err) => {
		console.error("Test failed:", err);
		process.exit(1);
	});
