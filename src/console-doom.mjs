const levels = [
  {
    maze: [
      "#############",
      "#S..........#",
      "#.##.###.##.#",
      "#...........#",
      "#.#.##.##.#.#",
      "#.#.......#.#",
      "#...#..#....#",
      "###.#..#.##.#",
      "#...........#",
      "#...##..#..E#",
      "#############",
    ],
    enemies: [[6.5, 1.5], [5.5, 5.5], [10.5, 8.5]],
  },
  {
    maze: [
      "#############",
      "#S....#.....#",
      "#.##..#.###.#",
      "#....##.....#",
      "###.#......##",
      "#...#.##....#",
      "#.#...##.##.#",
      "#.#.........#",
      "#...###.....#",
      "#.........E.#",
      "#############",
    ],
    enemies: [[4.5, 3.5], [9.5, 4.5], [10.5, 7.5], [3.5, 8.5]],
  },
  {
    maze: [
      "#############",
      "#S....#.....#",
      "#.....#.....#",
      "#.#.#.###.#.#",
      "#...#...#...#",
      "#.#.#.#.#.#.#",
      "#.#.....#...#",
      "#.###.#.###.#",
      "#.....#.....#",
      "#.........E.#",
      "#############",
    ],
    enemies: [[4.5, 2.5], [7.5, 4.5], [9.5, 5.5], [5.5, 8.5], [9.5, 8.5]],
  },
];
const width = 35;
const height = 19;
const field = .73;
const stride = .29;
const turn = Math.PI / 24;
const wallShades = " .:-=+*#%@";
const controls = "Completa tres niveles. ↑/↓ o W/S para avanzar y retroceder · ←/→ o A/D para girar · Espacio para disparar · M para ver el mapa. Busca la salida E.";
const enemySprite = [
  " ^   ^ ",
  "/#####\\",
  "|o###o|",
  "\\#v#v#/",
  " d   b ",
];
const exitSprite = [
  " +---+ ",
  " | ^ | ",
  " | E | ",
  " | | | ",
  " +---+ ",
];
const blaster = ["  _|_|_  ", " /#####\\ ", "|=======|"];

function isWall(maze, x, y) {
  return (maze[Math.floor(y)]?.[Math.floor(x)] ?? "#") === "#";
}

function walkable(maze, x, y, radius) {
  return !isWall(maze, x - radius, y - radius) && !isWall(maze, x + radius, y - radius) &&
    !isWall(maze, x - radius, y + radius) && !isWall(maze, x + radius, y + radius);
}

function move(maze, actor, dx, dy, radius) {
  if (walkable(maze, actor.x + dx, actor.y, radius)) actor.x += dx;
  if (walkable(maze, actor.x, actor.y + dy, radius)) actor.y += dy;
}

function castRay(maze, x, y, dx, dy) {
  let column = Math.floor(x);
  let row = Math.floor(y);
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const deltaX = Math.abs(1 / dx);
  const deltaY = Math.abs(1 / dy);
  let acrossX = dx === 0 ? Infinity : (stepX < 0 ? x - column : column + 1 - x) * deltaX;
  let acrossY = dy === 0 ? Infinity : (stepY < 0 ? y - row : row + 1 - y) * deltaY;
  let side = 0;
  let distance = 0;

  while (true) {
    if (acrossX < acrossY) {
      column += stepX;
      distance = acrossX;
      acrossX += deltaX;
      side = 0;
    } else {
      row += stepY;
      distance = acrossY;
      acrossY += deltaY;
      side = 1;
    }
    if (isWall(maze, column, row)) break;
  }
  const impact = side ? x + dx * distance : y + dy * distance;
  return { distance, side, seam: impact - Math.floor(impact) };
}

function hasSight(maze, from, to, distance) {
  return castRay(maze, from.x, from.y, (to.x - from.x) / distance, (to.y - from.y) / distance).distance >= distance;
}

function view(maze, exit, player, enemies, map, recoil) {
  const forwardX = Math.cos(player.angle);
  const forwardY = Math.sin(player.angle);
  const middle = (height - 1) / 2;
  const center = (width - 1) / 2;
  const board = Array.from({ length: height }, () => Array(width).fill(" "));
  const depths = [];

  for (let column = 0; column < width; column++) {
    const camera = (column / center - 1) * field;
    const { distance, side, seam } = castRay(maze, player.x, player.y, forwardX - forwardY * camera, forwardY + forwardX * camera);
    const half = height * .56 / Math.max(.15, distance);
    const shade = Math.max(2, Math.min(9, Math.round(10 - distance * .95 - side * 1.5)));
    const top = Math.round(middle - half);
    const bottom = Math.round(middle + half);
    depths.push(distance);

    for (let row = 0; row < height; row++) {
      if (row >= top && row <= bottom) {
        const border = row === top || row === bottom || seam < .09;
        board[row][column] = wallShades[border ? shade - 2 : shade];
      } else if (row > bottom && (column + row % 2) % (row < height - 3 ? 4 : 2) === 0) {
        board[row][column] = row < height - 4 ? "." : ":";
      }
    }
  }

  const sprites = [...enemies.filter(enemy => enemy.alive), { ...exit, isExit: true }].map(actor => {
    const dx = actor.x - player.x;
    const dy = actor.y - player.y;
    return { actor, depth: dx * forwardX + dy * forwardY, lateral: dy * forwardX - dx * forwardY };
  });
  sprites.sort((a, b) => b.depth - a.depth);

  for (const { actor, depth, lateral } of sprites) {
    if (depth <= .12) continue;
    const sprite = actor.isExit ? exitSprite : enemySprite;
    const spriteHeight = Math.max(3, Math.min(height * 2, Math.round(height * (actor.isExit ? 1.05 : .8) / depth)));
    const spriteWidth = Math.max(3, Math.round(spriteHeight * .95));
    const left = Math.round(center * (1 + lateral / (depth * field)) - spriteWidth / 2);
    const top = Math.round(middle + height * .49 / depth - spriteHeight);

    for (let column = Math.max(0, left); column < Math.min(width, left + spriteWidth); column++) {
      if (depth >= depths[column]) continue;
      const spriteColumn = Math.floor((column - left) * sprite[0].length / spriteWidth);
      for (let row = Math.max(0, top); row < Math.min(height, top + spriteHeight); row++) {
        const spriteRow = Math.floor((row - top) * sprite.length / spriteHeight);
        const cell = sprite[spriteRow][spriteColumn];
        if (cell !== " ") board[row][column] = cell;
      }
    }
  }

  board[middle][center] = recoil ? "*" : "+";
  for (let index = 0; index < blaster.length; index++) {
    const row = height - blaster.length + index + Number(recoil);
    if (row >= height) break;
    blaster[index].split("").forEach((cell, column) => {
      if (cell !== " ") board[row][center - 4 + column] = cell;
    });
  }

  if (map) {
    const facing = Math.round(player.angle / (Math.PI / 2) + 400) % 4;
    const mapWidth = maze[0].length;
    const markers = new Map(enemies.filter(enemy => enemy.alive).map(enemy => [Math.floor(enemy.y) * mapWidth + Math.floor(enemy.x), "x"]));
    markers.set(Math.floor(player.y) * mapWidth + Math.floor(player.x), ">v<^"[facing]);
    maze.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        board[y][width - row.length + x] = markers.get(y * row.length + x) ?? (cell === "." || cell === "S" ? " " : cell);
      });
    });
  }
  return board.map(row => row.join("")).join("\n");
}

export function createDoom() {
  let levelIndex = 0;
  let maze = levels[levelIndex].maze;
  let exit;
  let enemies;
  const player = { x: 1.5, y: 1.5, angle: 0, health: 100 };
  let game = "ready";
  let map = false;
  let cooldown = 0;
  let hurtCooldown = 0;
  let announcement = "Busca la salida E del laberinto.";

  function findMarker(marker) {
    const y = maze.findIndex(row => row.includes(marker));
    return { x: maze[y].indexOf(marker) + .5, y: y + .5 };
  }

  function loadLevel(index) {
    levelIndex = index;
    maze = levels[levelIndex].maze;
    const start = findMarker("S");
    exit = findMarker("E");
    player.x = start.x;
    player.y = start.y;
    player.angle = 0;
    enemies = levels[levelIndex].enemies.map(([x, y]) => ({ x, y, alive: true }));
    map = false;
    cooldown = 0;
    hurtCooldown = 0;
  }

  loadLevel(0);

  function fire() {
    if (cooldown) return;
    cooldown = 3;
    const forwardX = Math.cos(player.angle);
    const forwardY = Math.sin(player.angle);
    let target;
    let nearest = 8;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const depth = dx * forwardX + dy * forwardY;
      const lateral = dy * forwardX - dx * forwardY;
      if (depth > 0 && depth < nearest && Math.abs(lateral) < .32 && hasSight(maze, player, enemy, Math.hypot(dx, dy))) {
        nearest = depth;
        target = enemy;
      }
    }
    if (target) {
      target.alive = false;
      announcement = `Enemigo abatido. Quedan ${enemies.filter(enemy => enemy.alive).length}.`;
    }
  }

  function key(input, repeat) {
    const pressed = input.toLowerCase();
    if (pressed === "m") {
      if (!repeat) map = !map;
      return true;
    }
    const forward = pressed === "w" || pressed === "arrowup";
    const backward = pressed === "s" || pressed === "arrowdown";
    const left = pressed === "a" || pressed === "arrowleft";
    const right = pressed === "d" || pressed === "arrowright";
    const shoot = pressed === " " || pressed === "space" || pressed === "spacebar";
    if (!(forward || backward || left || right || shoot)) return false;
    if (game === "won" || game === "lost") return true;

    game = "playing";
    if (left || right) player.angle = (player.angle + (right ? turn : -turn) + 2 * Math.PI) % (2 * Math.PI);
    if (forward || backward) {
      const step = forward ? stride : -stride;
      move(maze, player, Math.cos(player.angle) * step, Math.sin(player.angle) * step, .19);
      if (Math.floor(player.x) === Math.floor(exit.x) && Math.floor(player.y) === Math.floor(exit.y)) {
        if (levelIndex < levels.length - 1) {
          const completed = levelIndex + 1;
          loadLevel(levelIndex + 1);
          game = "playing";
          announcement = `Nivel ${completed} completado. Siguiente: ${levelIndex + 1}.`;
        } else {
          game = "won";
          announcement = "¡Has completado los tres niveles!";
        }
      }
    }
    if (shoot) fire();
    return true;
  }

  function tick() {
    if (game !== "playing") return;
    if (cooldown > 0) cooldown--;
    if (hurtCooldown > 0) hurtCooldown--;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4.75 || (distance > .03 && !hasSight(maze, enemy, player, distance))) continue;
      if (distance > .68) move(maze, enemy, dx / distance * .085, dy / distance * .085, .18);
      else if (!hurtCooldown) {
        player.health -= 20;
        hurtCooldown = 9;
        announcement = `Te han alcanzado. Salud ${player.health}%.`;
        if (!player.health) {
          game = "lost";
          announcement = "Fin de la partida. Salud agotada.";
          break;
        }
      }
    }
  }

  function frame() {
    const done = game === "won" || game === "lost";
    const status = done
      ? `${announcement} R para reiniciar.`
      : `Nivel ${levelIndex + 1}/${levels.length} · Salud ${player.health}% · Enemigos ${enemies.filter(enemy => enemy.alive).length} · ${map ? "Mapa abierto" : "Salida E"}`;
    return { board: view(maze, exit, player, enemies, map, cooldown >= 2), status, announcement, idle: game === "ready", done };
  }

  return { title: "DOOM", controls, interval: 100, key, tick, frame };
}
