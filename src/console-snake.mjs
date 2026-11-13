const width = 16;
const height = 12;
const directions = {
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
};
const sameCell = (a, b) => a.x === b.x && a.y === b.y;
const border = "+" + "-".repeat(width * 2) + "+";

export function createSnake() {
  const snake = [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }];
  let food = { x: 11, y: 6 };
  let direction = directions.ArrowRight;
  let nextDirection;
  let running = false;
  let outcome = "";

  function placeFood() {
    const free = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = { x, y };
        if (!snake.some(segment => sameCell(segment, cell))) free.push(cell);
      }
    }
    if (!free.length) outcome = "Tablero completo. ¡Has ganado!";
    return free[Math.floor(Math.random() * free.length)];
  }

  function tick() {
    if (!running || outcome) return;
    if (nextDirection) {
      direction = nextDirection;
      nextDirection = undefined;
    }
    const head = { x: snake[0].x + direction[0], y: snake[0].y + direction[1] };
    const eats = sameCell(head, food);
    const hitsWall = head.x < 0 || head.x >= width || head.y < 0 || head.y >= height;
    const hitsBody = snake.some((cell, index) => (eats || index < snake.length - 1) && sameCell(cell, head));
    if (hitsWall || hitsBody) {
      outcome = "Fin de partida. Pulsa R para reiniciar.";
      return;
    }
    snake.unshift(head);
    if (eats) food = placeFood();
    else snake.pop();
  }

  function key(name) {
    if (name === "Enter") {
      running = true;
      return true;
    }
    if (!Object.hasOwn(directions, name)) return false;
    const turn = directions[name];
    if (outcome || nextDirection || (turn[0] === -direction[0] && turn[1] === -direction[1])) return true;
    if (turn !== direction) nextDirection = turn;
    running = true;
    return true;
  }

  function frame() {
    const cells = Array.from({ length: height }, () => Array(width).fill("  "));
    if (food) cells[food.y][food.x] = "<>";
    for (const cell of snake) cells[cell.y][cell.x] = "oo";
    cells[snake[0].y][snake[0].x] = "@@";
    const board = [border, ...cells.map(row => "|" + row.join("") + "|"), border].join("\n");
    const score = `Puntos ${snake.length - 3}`;
    const status = outcome || (running ? score : `${score} · Intro para empezar`);
    return { board, status, idle: !running, done: Boolean(outcome), announcement: outcome ? `${outcome} ${score}.` : score };
  }

  return {
    title: "SNAKE",
    controls: "Flechas o WASD mover",
    get interval() { return Math.max(65, 165 - (snake.length - 3) * 7); },
    key, tick, frame,
  };
}
