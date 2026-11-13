const orbitPoints = [[-.86, -.51], [0, -1], [.86, -.51], [-.73, .68], [.73, .68]];
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);

export function createNavigation(nav, stage, reducedMotion) {
  const root = document.documentElement;
  const orbit = stage.querySelector(".identity__orbit");
  const items = [...nav.querySelectorAll("li")];
  let stageHeight = 1;
  let dockDistance = 1;
  let position = 0;
  let painted;
  let paintedIdentity;
  let frame = 0;
  let lastTime = 0;

  function paint() {
    if (position === painted) return;
    painted = position;
    const dock = position * (1.2 + position * (.6 - .8 * position));
    nav.toggleAttribute("data-floating", position === 0);
    nav.toggleAttribute("data-docked", position === 1);
    nav.style.setProperty("--nav-dock", dock.toFixed(4));
    nav.style.setProperty("--nav-arc", (4 * dock * (1 - dock)).toFixed(4));
    nav.style.setProperty("--nav-lower-dock", smooth(clamp((dock - .48) / .52)).toFixed(4));
    nav.style.setProperty("--nav-surface", smooth(clamp((dock - .44) / .56)).toFixed(4));
    nav.style.setProperty("--nav-orbit-alpha", (1 - smooth(clamp((dock - .06) / .66))).toFixed(4));
    const identity = 1 - smooth(clamp((dock - .22) / .35));
    if (identity !== paintedIdentity) {
      paintedIdentity = identity;
      stage.style.setProperty("--hero-identity-alpha", identity.toFixed(4));
      stage.toggleAttribute("data-identity-faded", identity === 0);
    }
  }

  function targetPosition() {
    const target = clamp((scrollY - 8) / dockDistance);
    return reducedMotion.matches ? Number(target > 0) : target;
  }

  function settle(now) {
    frame = 0;
    if (nav.inert || root.hasAttribute("data-large-text")) return;
    const target = targetPosition();
    const elapsed = lastTime ? Math.min(now - lastTime, 60) : 16.7;
    position = reducedMotion.matches || scrollY >= stageHeight
      ? target
      : position + (target - position) * (1 - Math.exp(-elapsed / 52));
    if (Math.abs(target - position) < .0015) {
      position = target;
      lastTime = 0;
    } else {
      lastTime = now;
      frame = requestAnimationFrame(settle);
    }
    paint();
  }

  function update() {
    if (!frame && !nav.inert && !root.hasAttribute("data-large-text")) frame = requestAnimationFrame(settle);
  }

  function measure() {
    if (frame) cancelAnimationFrame(frame);
    frame = lastTime = 0;
    if (root.hasAttribute("data-large-text") || !nav.clientWidth) return;
    const center = orbit.offsetLeft;
    const height = orbit.offsetTop;
    const radius = orbit.offsetWidth / 2;
    stageHeight = stage.clientHeight;
    dockDistance = Math.max(96, stageHeight * .48);
    const offsets = items.map((item, index) => {
      const box = item.getBoundingClientRect();
      const [x, y] = orbitPoints[index];
      return {
        x: center + x * radius - box.left - box.width / 2,
        y: height + y * radius - box.top - box.height / 2,
      };
    });
    items.forEach((item, index) => {
      item.style.setProperty("--orbit-x", offsets[index].x + "px");
      item.style.setProperty("--orbit-y", offsets[index].y + "px");
      item.style.setProperty("--orbit-sway", orbitPoints[index][0] * 16 + "px");
      item.style.setProperty("--float-delay", -index * 1.25 + "s");
    });
    position = targetPosition();
    paint();
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", measure);
  reducedMotion.addEventListener("change", update);
  document.fonts.ready.then(measure);
  return { measure };
}
