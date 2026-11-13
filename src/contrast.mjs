import { createAccessibility } from "./accessibility.mjs";
import { createCircuitDemo } from "./circuit-demo.mjs";
import { createJourneyPrism } from "./journey-prism.mjs";

createAccessibility(document.documentElement);
createCircuitDemo(matchMedia("all"));
createJourneyPrism(document.querySelector(".journey-prism"));
