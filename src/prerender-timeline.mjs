export const framesPerSecond = 30;
export const sphereStop = .72;
export const automaticFlightDuration = 4700;
export const flightEnd = automaticFlightDuration / 1000;
export const backgroundDuration = 3.2;

export function flightTime(progress) {
  // Invert the smoothstep used by the automatic flight.
  return flightEnd * (.5 - Math.sin(Math.asin(1 - 2 * progress) / 3));
}

export function arrivalOpacity(progress, smoothstep) {
  return smoothstep(progress, .923, .989);
}

export function portalOpacity(progress, smoothstep) {
  return smoothstep(progress, .792, .858) * (1 - smoothstep(progress, .858, .915)) * .58;
}
