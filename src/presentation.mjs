import { createNavigation } from "./navigation.mjs";
import { createPortfolioContent } from "./portfolio.mjs";
import { createAccessibility } from "./accessibility.mjs";

export function createPresentation({ onTheme, onSkipContent, translate = value => value }) {
  const root = document.documentElement;
  const stage = document.querySelector(".stage");
  const identity = document.querySelector(".identity");
  const portfolioNav = document.querySelector(".portfolio-nav");
  const heading = document.querySelector("#nombre");
  const themeButton = document.querySelector(".theme");
  const skipButton = document.querySelector(".skip-intro");
  const contentDown = document.querySelector(".content-down");
  const skipContent = document.querySelector(".skip-content");
  const storyHeading = document.querySelector("#story-title");
  const orbTarget = document.querySelector(".orb-target");
  const portalLight = document.querySelector(".portal-light");
  const statusBar = document.querySelector('meta[name="theme-color"]');
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const navigation = createNavigation(portfolioNav, stage, reducedMotion);
  const preferenceKey = "portfolio-dlb-tema";
  const linkedSection = document.getElementById(location.hash.slice(1));
  const linkedChapter = linkedSection?.matches(".chapter") ? linkedSection : null;
  let theme = 0;
  let arrivedBefore;
  let paintedOpacity;

  function setTheme(next) {
    theme = next;
    root.dataset.theme = theme ? "dia" : "noche";
    const action = theme ? "Cambiar a modo noche" : "Cambiar a modo día";
    themeButton.setAttribute("aria-label", translate(action));
    statusBar.content = theme ? "#d9edf5" : "#080e28";
    onTheme(theme);
  }

  function setArrival(arrived, opacity = 1, focusHeading = false) {
    const changed = arrived !== arrivedBefore;
    const active = changed ? document.activeElement : null;
    if (changed && !arrived && (identity.contains(active) || portfolioNav.contains(active) || active === contentDown)) {
      themeButton.focus({ preventScroll: true });
    }
    if (opacity !== paintedOpacity) {
      if (paintedOpacity === undefined || Boolean(opacity) !== Boolean(paintedOpacity)) {
        portfolioNav.toggleAttribute("data-nav-visible", opacity > 0);
      }
      paintedOpacity = opacity;
      identity.style.opacity = opacity;
      portfolioNav.style.opacity = opacity;
    }
    if (!changed) return;
    arrivedBefore = arrived;
    identity.inert = !arrived;
    portfolioNav.inert = !arrived;
    root.toggleAttribute("data-portfolio", arrived);
    if (arrived) navigation.measure();
    if (arrived && focusHeading && (active === document.body || active === orbTarget || active === skipButton)) {
      heading.focus({ preventScroll: true });
    }
  }

  themeButton.addEventListener("click", () => {
    setTheme(1 - theme);
    try { localStorage.setItem(preferenceKey, root.dataset.theme); } catch { /* Optional persistence. */ }
  });
  contentDown.addEventListener("click", event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    requestAnimationFrame(() => {
      if (!event.defaultPrevented && location.hash === contentDown.hash) {
        storyHeading.focus({ preventScroll: true });
      }
    });
  });
  skipContent.addEventListener("click", event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!arrivedBefore) onSkipContent();
    const { hash } = skipContent;
    if (location.hash !== hash) {
      try { history.pushState(history.state, "", hash); } catch { location.hash = hash; }
    }
    storyHeading.closest(".chapter").scrollIntoView({ behavior: "instant" });
    storyHeading.focus({ preventScroll: true });
  });

  root.addEventListener("portfolio-text-size", navigation.measure);
  root.dataset.ready = "";
  createAccessibility(root);
  createPortfolioContent(portfolioNav, reducedMotion);
  let storedTheme;
  try { storedTheme = localStorage.getItem(preferenceKey); } catch { /* Optional persistence. */ }
  setTheme(Number(storedTheme === "dia"));
  if (linkedChapter) requestAnimationFrame(() => linkedChapter.scrollIntoView({ behavior: "instant" }));

  return { root, stage, themeButton, skipButton, orbTarget, portalLight, heading, reducedMotion, navigation, linkedChapter, setArrival };
}
