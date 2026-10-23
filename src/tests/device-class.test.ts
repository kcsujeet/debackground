import { expect, test } from "bun:test";
import { isMobileDevice } from "../lib/device-class";

// User agents as browsers report them, including Chrome's reduced Android one.
const GALAXY_S22_CHROME =
	"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36";
const ANDROID_TABLET_CHROME =
	"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";
const IPHONE_SAFARI =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const MAC_SAFARI =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const WINDOWS_CHROME =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";

test("an Android phone in Chrome is mobile", () => {
	expect(
		isMobileDevice({
			userAgent: GALAXY_S22_CHROME,
			maxTouchPoints: 5,
			userAgentData: { mobile: true },
		}),
	).toBe(true);
});

test("an Android tablet is mobile though Chrome says it is not", () => {
	expect(
		isMobileDevice({
			userAgent: ANDROID_TABLET_CHROME,
			maxTouchPoints: 10,
			userAgentData: { mobile: false },
		}),
	).toBe(true);
});

test("an iPhone is mobile without userAgentData", () => {
	expect(isMobileDevice({ userAgent: IPHONE_SAFARI, maxTouchPoints: 5 })).toBe(
		true,
	);
});

test("an iPad posing as a Mac is mobile", () => {
	expect(isMobileDevice({ userAgent: MAC_SAFARI, maxTouchPoints: 5 })).toBe(
		true,
	);
});

test("a real Mac is not mobile", () => {
	expect(isMobileDevice({ userAgent: MAC_SAFARI, maxTouchPoints: 0 })).toBe(
		false,
	);
});

test("a Windows desktop, even with a touch screen, is not mobile", () => {
	expect(
		isMobileDevice({
			userAgent: WINDOWS_CHROME,
			maxTouchPoints: 10,
			userAgentData: { mobile: false },
		}),
	).toBe(false);
});
