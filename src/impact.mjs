import { Vector3 } from "./vendor/three.module.min.js";

const spring = 4.4;

export class Impact {
  offset = new Vector3();
  velocity = new Vector3();
  time = 0;

  push(direction, speed, time) {
    this.advance(time);
    this.velocity.addScaledVector(direction, speed).clampLength(0, 38);
  }

  advance(time) {
    const elapsed = Math.max(0, time - this.time);
    this.time = time;
    const decay = Math.exp(-spring * elapsed);
    const springStep = spring * elapsed;
    const { offset, velocity } = this;
    for (const axis of ["x", "y", "z"]) {
      const position = offset[axis];
      const speed = velocity[axis];
      offset[axis] = ((1 + springStep) * position + elapsed * speed) * decay;
      velocity[axis] = ((1 - springStep) * speed - spring * springStep * position) * decay;
    }
    return offset;
  }

  get settled() {
    return this.offset.lengthSq() < .00001 && this.velocity.lengthSq() < .00001;
  }
}
