const faceTurn = 120;

export function createJourneyPrism(root) {
  const rotor = root.querySelector("[data-prism-rotor]");
  const tabList = root.querySelector("[data-prism-tabs]");
  const tabs = [...tabList.querySelectorAll("[data-prism-tab]")];
  const faces = [...rotor.querySelectorAll("[data-prism-face]")];
  const faceIndex = step => ((step % faces.length) + faces.length) % faces.length;
  let selectedStep;

  function select(index, animate = false) {
    if (selectedStep !== undefined && index === faceIndex(selectedStep)) return;
    selectedStep = index + Math.round(((selectedStep ?? index) - index) / faces.length) * faces.length;
    rotor.toggleAttribute("data-prism-instant", !animate);
    rotor.style.setProperty("--prism-turn", `${-selectedStep * faceTurn}deg`);

    const focusedFace = faces.find(face => face.contains(document.activeElement));
    if (focusedFace && focusedFace !== faces[index]) tabs[index].focus({ preventScroll: true });

    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      faces[i].toggleAttribute("data-prism-active", active);
      faces[i].inert = !active;
      if (active) faces[i].removeAttribute("aria-hidden");
      else faces[i].setAttribute("aria-hidden", "true");
      faces[i].tabIndex = active ? 0 : -1;
    });
  }

  tabList.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    faces[index].setAttribute("role", "tabpanel");
    faces[index].setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", event => select(index, event.detail > 0));
  });
  tabList.addEventListener("keydown", event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === "ArrowLeft") next = faceIndex(index - 1);
    else if (event.key === "ArrowRight") next = faceIndex(index + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[next].focus({ preventScroll: true });
    select(next);
  });

  select(0);
  root.setAttribute("data-prism-ready", "");
  tabList.hidden = false;
}
