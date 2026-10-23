export interface NavigatorHints {
	userAgent: string;
	maxTouchPoints: number;
	userAgentData?: { mobile: boolean };
}

const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod/i;
const TOUCH_SCREEN_POINTS = 1;

/**
 * Whether this is a phone or tablet, whose browser tab gets far less memory than
 * a desktop's. BEN2 ran out of it on an 8 GB Galaxy S22+ partway through
 * inference, and `deviceMemory` cannot tell that phone from a desktop: Chrome
 * reports at most 8.
 *
 * Errs towards "mobile": wrongly calling a desktop mobile only costs it the
 * enhanced model, while the reverse kills the tab.
 * - `userAgentData.mobile` is Chromium only and false on Android tablets.
 * - Every Android, iPhone and iPad user agent is caught by the regex.
 * - iPadOS Safari presents itself as a desktop Mac, so a Mac with a touch
 *   screen is an iPad.
 *
 * Reads the page's `navigator`: `maxTouchPoints` does not exist in workers.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/mobile
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/maxTouchPoints
 */
export function isMobileDevice(nav: NavigatorHints): boolean {
	if (nav.userAgentData?.mobile) return true;
	if (MOBILE_USER_AGENT.test(nav.userAgent)) return true;

	return (
		nav.userAgent.includes("Macintosh") &&
		nav.maxTouchPoints > TOUCH_SCREEN_POINTS
	);
}
