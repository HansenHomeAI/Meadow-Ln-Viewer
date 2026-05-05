import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../3d/index.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../3d/index.css", import.meta.url), "utf8");

const tapDotsOverlay = source.match(/function TapDotsOverlay\([\s\S]*?\n}\n\n\/\/ components\/sogs-migrated-viewer\/TapPickFeedback\.tsx/)?.[0] || "";

if (!tapDotsOverlay) {
  throw new Error("TapDotsOverlay source block was not found.");
}

if (!tapDotsOverlay.includes("__sogsProjectWorldPoint")) {
  throw new Error("TapDotsOverlay must use the viewer projection bridge so dots stay pinned to the viewer camera.");
}

if (tapDotsOverlay.includes("createOverlayPerspectiveCamera") || tapDotsOverlay.includes("syncOverlayCamera")) {
  throw new Error("TapDotsOverlay must not use the old parent-side camera approximation.");
}

if (!source.includes("TAP_DOT_DEFAULT_MAX_DISTANCE") || !source.includes("tapDotDistanceOpacity")) {
  throw new Error("TapDotsOverlay must include distance limits/fade behavior.");
}

if (!source.includes("var TAP_DOT_DEFAULT_MAX_DISTANCE = 50;")) {
  throw new Error("Tap dot default max distance must stay at 50 units.");
}

const tapDotMaxDistanceMatches = source.match(/maxDistance: 50/g) || [];
if (tapDotMaxDistanceMatches.length < 2) {
  throw new Error("Bundled tap dots must use a 50 unit max distance.");
}

if (!source.includes("maxDistance: 50") || !source.includes("maxRadiusFromOrigin: 50")) {
  throw new Error("Viewer distance and radius caps must stay at 50 units.");
}

const tapDotBubbleCss = css.match(/\.tapdot-label-bubble \{[\s\S]*?\n\}/)?.[0] || "";
const tapDotTextCss = css.match(/\.tapdot-label-text \{[\s\S]*?\n\}/)?.[0] || "";
const tapDotCameraCss = css.match(/\.tapdot-label-bubble \.tapdot-camera-icon \{[\s\S]*?\n\}/)?.[0] || "";
const tapDotCameraSizeCss = css.match(/\.tapdot-label-bubble\.has-camera \{[\s\S]*?\n\}/)?.[0] || "";

const requiredPolishTokens = [
  "--tapdot-pill-gap: 8px;",
  "--tapdot-pill-padding-y: 9px;",
  "--tapdot-pill-padding-left: 15px;",
  "--tapdot-pill-padding-right: 17px;",
  "gap: var(--tapdot-pill-gap);",
  "padding: var(--tapdot-pill-padding-y) var(--tapdot-pill-padding-right) var(--tapdot-pill-padding-y) var(--tapdot-pill-padding-left);",
  "font-size: 17px;",
  "font-weight: 400;",
  "line-height: 1.5;",
  "letter-spacing: 0.2px;"
];

for (const token of requiredPolishTokens) {
  if (!tapDotBubbleCss.includes(token)) {
    throw new Error(`Tap dot pills must include polished spacing token: ${token}`);
  }
}

if (!tapDotTextCss.includes("line-height: 1.5;") || !tapDotTextCss.includes("letter-spacing: 0.2px;")) {
  throw new Error("Tap dot label text must match the bio copy line-height and letter spacing.");
}

if (!tapDotCameraCss.includes("margin: 0;") || tapDotCameraCss.includes("margin-right: -2px;")) {
  throw new Error("Tap dot camera icon must not use negative right margin; it should rely on the explicit pill gap.");
}

if (!tapDotCameraCss.includes("display: block;") || !tapDotCameraSizeCss.includes("--tapdot-camera-size: 24px;")) {
  throw new Error("Tap dot camera icon should be a fixed 24px block inside the polished pill layout.");
}

if (tapDotBubbleCss.includes("min-height: 40px;")) {
  throw new Error("Tap dot pills should not force the larger polished height.");
}

const oldEffectiveGap = 6 - 2;
const newEffectiveGap = 8;
const gapImprovementPct = Math.round(((newEffectiveGap - oldEffectiveGap) / oldEffectiveGap) * 100);
console.log(`Tap dot overlay regression checks passed. Pill gap ${oldEffectiveGap}px -> ${newEffectiveGap}px (+${gapImprovementPct}%), icon 22px -> 24px, bio typography 17px/400/1.5 applied.`);
