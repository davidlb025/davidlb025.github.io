const columns = 10;
const rows = 20;
const linePoints = [0, 100, 300, 500, 800];
const kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]];
const shapes = {
  I: [4, [[0, 1], [1, 1], [2, 1], [3, 1]]],
  J: [3, [[0, 0], [0, 1], [1, 1], [2, 1]]],
  L: [3, [[2, 0], [0, 1], [1, 1], [2, 1]]],
  O: [2, [[0, 0], [1, 0], [0, 1], [1, 1]]],
  S: [3, [[1, 0], [2, 0], [0, 1], [1, 1]]],
  T: [3, [[1, 0], [0, 1], [1, 1], [2, 1]]],
  Z: [3, [[0, 0], [1, 0], [1, 1], [2, 1]]],
};
const types = Object.keys(shapes);
const rotations = Object.fromEntries(Object.entries(shapes).map(([type, [size, initial]]) => {
  const positions = [initial];
  while (positions.length < 4) {
    const last = positions.at(-1);
    positions.push(last.map(([x, y]) => [size - 1 - y, x]));
  }
  return [type, positions];
}));
const emptyRow = () => Array(columns).fill(false);
const border = "+" + "-".repeat(columns * 2) + "+";

function preview(type) {
  const cells = rotations[type][0];
  const firstRow = Math.min(...cells.map(([, y]) => y));
  const image = Array.from({ length: 2 }, () => Array(4).fill("  "));
  for (const [x, y] of cells) image[y - firstRow][x] = "[]";
  return [`Próxima: ${image[0].join("")}`, `         ${image[1].join("")}`];
}

export function createTetris() {
  let grid = Array.from({ length: rows }, emptyRow);
  let bag = [];
  let next = draw();
  let active;
  let score = 0;
  let clearedLines = 0;
  let level = 1;

  function draw() {
    if (!bag.length) {
      bag = [...types];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }

  function fits(type, rotation, x, y) {
    return rotations[type][rotation].every(([dx, dy]) => {
      const col = x + dx;
      const row = y + dy;
      return col >= 0 && col < columns && row >= -2 && row < rows &&
        (row < 0 || !grid[row][col]);
    });
  }

  function spawn() {
    const type = next;
    next = draw();
    const x = Math.floor((columns - shapes[type][0]) / 2);
    active = fits(type, 0, x, 0) ? { type, x, y: 0, rotation: 0 } : null;
  }

  function move(dx, dy) {
    const { type, rotation, x, y } = active;
    if (!fits(type, rotation, x + dx, y + dy)) return false;
    active.x += dx;
    active.y += dy;
    return true;
  }

  function rotate(direction) {
    const { type, rotation, x, y } = active;
    const turn = (rotation + direction + 4) % 4;
    const offset = kicks.find(([dx, dy]) => fits(type, turn, x + dx, y + dy));
    if (!offset) return;
    active.rotation = turn;
    active.x += offset[0];
    active.y += offset[1];
  }

  function landing() {
    const { type, rotation, x, y } = active;
    let bottom = y;
    while (fits(type, rotation, x, bottom + 1)) bottom++;
    return bottom;
  }

  function lock() {
    const { type, rotation, x, y } = active;
    const cells = rotations[type][rotation];
    if (cells.some(([, dy]) => y + dy < 0)) {
      active = null;
      return;
    }
    for (const [dx, dy] of cells) grid[y + dy][x + dx] = true;

    const remaining = grid.filter(row => row.some(cell => !cell));
    const cleared = rows - remaining.length;
    if (cleared) {
      grid = [...Array.from({ length: cleared }, emptyRow), ...remaining];
      score += linePoints[cleared] * level;
      clearedLines += cleared;
      level = 1 + Math.floor(clearedLines / 10);
    }
    spawn();
  }

  function drop() {
    const bottom = landing();
    score += (bottom - active.y) * 2;
    active.y = bottom;
    lock();
  }

  function fall(manual = false) {
    if (!active) return;
    if (move(0, 1)) {
      if (manual) score++;
    } else {
      lock();
    }
  }

  const actions = new Map([
    ["ArrowLeft", () => move(-1, 0)],
    ["ArrowRight", () => move(1, 0)],
    ["ArrowDown", () => fall(true)],
    ["ArrowUp", () => rotate(1)],
    ["x", () => rotate(1)],
    ["z", () => rotate(-1)],
    [" ", drop],
    ["Spacebar", drop],
    ["Space", drop],
  ]);

  function key(key, repeat = false) {
    const action = actions.get(key.length === 1 ? key.toLowerCase() : key);
    if (!action) return false;
    if (active && !(repeat && action === drop)) action();
    return true;
  }

  function frame() {
    const image = grid.map(row => row.map(cell => cell ? "##" : "  "));
    if (active) {
      const { type, rotation, x, y } = active;
      const bottom = landing();
      for (const [dx, dy] of rotations[type][rotation]) {
        if (bottom + dy >= 0) image[bottom + dy][x + dx] = "..";
      }
      for (const [dx, dy] of rotations[type][rotation]) {
        if (y + dy >= 0) image[y + dy][x + dx] = "[]";
      }
    }
    const board = [...preview(next), border, ...image.map(row => `|${row.join("")}|`), border].join("\n");
    const stats = `Puntos: ${score} · Líneas: ${clearedLines} · Nivel: ${level}`;
    return active ? { board, status: stats } : {
      board,
      status: `Fin de la partida · ${stats}`,
      announcement: "Fin de la partida. Pulsa R para reiniciar.",
      done: true,
    };
  }

  spawn();
  return {
    title: "Tetris",
    controls: "← → Mover · ↓ Bajar · ↑ / X Girar · Z Girar al revés · Espacio Caída rápida",
    get interval() { return Math.max(95, Math.round(760 * .82 ** (level - 1))); },
    key,
    tick: () => fall(),
    frame,
  };
}
