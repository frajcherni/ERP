// Full screen for the whole app. The button in the top bar
// (Components/Common/FullScreenDropdown) and the "full screen by default" start
// both go through here.
//
// A browser never puts a page in full screen by itself when it loads: the request
// has to answer a click, a tap or a key press. So "by default" means that the
// first time the user clicks or types after opening the site, the page goes full
// screen (on the login page already, if that is where they start). Leaving it
// again, with the button or Esc, is respected until the site is opened next.

type FullscreenDocument = {
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  exitFullscreen?: () => Promise<void> | void;
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
};

type FullscreenTarget = {
  requestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
};

const CHANGE_EVENTS = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"];

// The top-bar button is hidden below this width (Bootstrap's `sm`). On a phone
// there would be no way out of a full screen the app had put itself in.
const BUTTON_VISIBLE = "(min-width: 576px)";

export function isFullscreen(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
}

function canFullscreen(): boolean {
  const el = document.documentElement as FullscreenTarget;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen);
}

// The standard calls return a promise that rejects when the browser says no
// (nothing was clicked, a policy forbids it). There is nothing to do about that.
function settle(result: unknown): void {
  Promise.resolve(result).catch(() => undefined);
}

export function enterFullscreen(): void {
  const el = document.documentElement as FullscreenTarget;
  try {
    if (el.requestFullscreen) settle(el.requestFullscreen());
    else if (el.webkitRequestFullscreen) settle(el.webkitRequestFullscreen());
    else if (el.mozRequestFullScreen) settle(el.mozRequestFullScreen());
  } catch {
    // refused
  }
}

export function exitFullscreen(): void {
  if (!isFullscreen()) return;
  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) settle(doc.exitFullscreen());
    else if (doc.webkitExitFullscreen) settle(doc.webkitExitFullscreen());
    else if (doc.mozCancelFullScreen) settle(doc.mozCancelFullScreen());
  } catch {
    // already out
  }
}

export function toggleFullscreen(): void {
  if (isFullscreen()) exitFullscreen();
  else enterFullscreen();
}

/** Tells `listener` whenever the page goes into or out of full screen. Returns the way to stop. */
export function onFullscreenChange(listener: (active: boolean) => void): () => void {
  const handler = () => listener(isFullscreen());
  CHANGE_EVENTS.forEach((name) => document.addEventListener(name, handler));
  return () => CHANGE_EVENTS.forEach((name) => document.removeEventListener(name, handler));
}

/**
 * Full screen is the default: the first click, tap or typed key after the site
 * opens turns it on. Called once, when the app starts.
 *
 * It waits for a real gesture, tries again at the next one if the browser said
 * no, and is done for good once the page is in full screen, however it got
 * there. After that it never forces it back: leaving full screen stays left.
 */
export function startFullscreenByDefault(): void {
  if (!canFullscreen() || isFullscreen()) return;

  function stop() {
    document.removeEventListener("click", onGesture, true);
    document.removeEventListener("keydown", onGesture, true);
    CHANGE_EVENTS.forEach((name) => document.removeEventListener(name, onChange));
  }

  function onChange() {
    if (isFullscreen()) stop();
  }

  function onGesture(event: Event) {
    // Typing counts. Shortcuts (Ctrl+R, Alt+Tab…) and keys like Shift, Tab or Esc do not.
    if (event instanceof KeyboardEvent) {
      const typing = !event.ctrlKey && !event.metaKey && !event.altKey && (event.key.length === 1 || event.key === "Enter");
      if (!typing) return;
    }
    // The full screen button itself is being pressed: that press does the job.
    if (event.target instanceof Element && event.target.closest("[data-fullscreen-toggle]")) {
      stop();
      return;
    }
    if (!window.matchMedia(BUTTON_VISIBLE).matches) return;
    enterFullscreen();
  }

  document.addEventListener("click", onGesture, true);
  document.addEventListener("keydown", onGesture, true);
  CHANGE_EVENTS.forEach((name) => document.addEventListener(name, onChange));
}
