export function createCircuitDemo(reducedMotion) {
  for (const board of document.querySelectorAll(".circuit-demo")) {
    const inputA = board.querySelector('[data-circuit-input="a"]');
    const inputB = board.querySelector('[data-circuit-input="b"]');
    const output = board.querySelector(".circuit-demo__result strong");
    const packets = [...board.querySelectorAll(".circuit-demo__packet")];
    const pulses = new Map();

    function playPulse(packet, delay = 0) {
      if (reducedMotion.matches || !packet.animate) return;
      pulses.get(packet)?.cancel();
      const animation = packet.animate([
        { strokeDashoffset: "12", opacity: 0 },
        { opacity: 1, offset: .18 },
        { opacity: 1, offset: .83 },
        { strokeDashoffset: "-100", opacity: 0 },
      ], { duration: 480, delay });
      pulses.set(packet, animation);
      animation.onfinish = animation.oncancel = () => {
        if (pulses.get(packet) === animation) pulses.delete(packet);
      };
    }

    function updateInput(button, index) {
      const active = button.getAttribute("aria-pressed") === "false";
      const value = active ? "1" : "0";
      button.setAttribute("aria-pressed", String(active));
      button.querySelector("strong").textContent = value;
      board.dataset[index === 0 ? "inputA" : "inputB"] = value;

      const result = board.dataset.inputA === "1" && board.dataset.inputB === "1";
      const next = result ? "1" : "0";
      const changed = next !== board.dataset.output;
      board.dataset.output = next;
      if (changed) output.textContent = next;

      if (active) playPulse(packets[index]);
      else pulses.get(packets[index])?.cancel();
      if (changed && result) playPulse(packets[2], 250);
      if (changed && !result) pulses.get(packets[2])?.cancel();
    }

    [inputA, inputB].forEach((button, index) => {
      button.disabled = false;
      button.addEventListener("click", () => updateInput(button, index));
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.intersectionRatio < .35) return;
        if (board.dataset.inputA === "1") playPulse(packets[0]);
        observer.disconnect();
      }, { threshold: .35 });
      observer.observe(board);
    }

    reducedMotion.addEventListener("change", () => {
      if (!reducedMotion.matches) return;
      pulses.forEach(animation => animation.cancel());
      pulses.clear();
    });
  }
}
