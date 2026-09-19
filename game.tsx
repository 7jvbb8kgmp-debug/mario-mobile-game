import { useCallback, useEffect, useRef, useState } from "react";
import type { Coin, Enemy, Goal, LevelBlock, Player, TouchState } from "./game.types";

const WORLD_WIDTH = 2600;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

const INITIAL_BLOCKS: LevelBlock[] = [
  { x: 0, y: 500, w: 460, h: 40 },
  { x: 470, y: 470, w: 200, h: 70 },
  { x: 720, y: 440, w: 180, h: 100 },
  { x: 960, y: 500, w: 250, h: 40 },
  { x: 1250, y: 430, w: 180, h: 110 },
  { x: 1460, y: 500, w: 360, h: 40 },
  { x: 1840, y: 470, w: 200, h: 70 },
  { x: 2060, y: 500, w: 540, h: 40 },
];

const INITIAL_COINS: Coin[] = [
  { x: 260, y: 450, r: 9, collected: false },
  { x: 540, y: 410, r: 9, collected: false },
  { x: 780, y: 380, r: 9, collected: false },
  { x: 1020, y: 440, r: 9, collected: false },
  { x: 1310, y: 360, r: 9, collected: false },
  { x: 1520, y: 440, r: 9, collected: false },
  { x: 1635, y: 440, r: 9, collected: false },
  { x: 1880, y: 420, r: 9, collected: false },
  { x: 2140, y: 440, r: 9, collected: false },
];

const INITIAL_ENEMIES: Enemy[] = [
  { x: 610, y: 445, w: 32, h: 28, minX: 500, maxX: 650, dir: 1, speed: 1.2, alive: true },
  { x: 910, y: 470, w: 32, h: 28, minX: 820, maxX: 1160, dir: 1, speed: 1.7, alive: true },
  { x: 1660, y: 470, w: 32, h: 28, minX: 1480, maxX: 1800, dir: 1, speed: 1.4, alive: true },
];

const INITIAL_PLAYER: Player = {
  x: 90, y: 370, w: 30, h: 42, vx: 0, vy: 0,
  speed: 4.3, jumpPower: 13.5, onGround: false,
  facing: 1, coins: 0, lives: 3,
};

const GOAL: Goal = { x: 2460, y: 350, w: 30, h: 150 };

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawScene(ctx: CanvasRenderingContext2D, player: Player, coins: Coin[], enemies: Enemy[], cameraX: number) {
  ctx.fillStyle = "#7ad6ff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#8acb6d";
  ctx.fillRect(0, 470, CANVAS_WIDTH, 70);

  for (const block of INITIAL_BLOCKS) {
    const x = block.x - cameraX;
    ctx.fillStyle = "#7f5a3a";
    ctx.fillRect(x, block.y, block.w, block.h);
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(x, block.y, block.w, 12);
  }

  for (const coin of coins) {
    if (coin.collected) continue;
    ctx.fillStyle = "#ffd93b";
    ctx.beginPath();
    ctx.arc(coin.x - cameraX, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.fillStyle = "#6d3d1f";
    ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "white";
    ctx.fillRect(enemy.x - cameraX + 6, enemy.y + 6, 6, 6);
    ctx.fillRect(enemy.x - cameraX + 18, enemy.y + 6, 6, 6);
  }

  ctx.fillStyle = "#cfcfcf";
  ctx.fillRect(GOAL.x - cameraX, GOAL.y, 6, GOAL.h);
  ctx.fillStyle = "#ff3d3d";
  ctx.beginPath();
  ctx.moveTo(GOAL.x - cameraX + 6, GOAL.y + 10);
  ctx.lineTo(GOAL.x - cameraX + 56, GOAL.y + 26);
  ctx.lineTo(GOAL.x - cameraX + 6, GOAL.y + 42);
  ctx.fill();

  const x = player.x - cameraX;
  ctx.fillStyle = "#f8d7a8";
  ctx.fillRect(x + 8, player.y, 14, 18);
  ctx.fillStyle = "#e53935";
  ctx.fillRect(x + 6, player.y - 10, 18, 10);
  ctx.fillStyle = "#1d4fd0";
  ctx.fillRect(x + 2, player.y + 18, 26, 18);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 10, player.y + 30, 4, 12);
  ctx.fillRect(x + 18, player.y + 30, 4, 12);

  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(20, 18, 240, 70);
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Coins: ${player.coins}`, 35, 48);
  ctx.fillText(`Lives: ${player.lives}`, 35, 76);
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const touch = useRef<TouchState>({ left: false, right: false, jump: false });
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [coins, setCoins] = useState<Coin[]>(INITIAL_COINS);
  const [enemies, setEnemies] = useState<Enemy[]>(INITIAL_ENEMIES);
  const [cameraX, setCameraX] = useState(0);
  const [message, setMessage] = useState("");

  const reset = useCallback(() => {
    setPlayer({ ...INITIAL_PLAYER });
    setCoins(INITIAL_COINS.map((coin) => ({ ...coin })));
    setEnemies(INITIAL_ENEMIES.map((enemy) => ({ ...enemy })));
    setCameraX(0);
    setMessage("");
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.key] = true;
      if (event.key.toLowerCase() === "r") reset();
    };
    const up = (event: KeyboardEvent) => { keys.current[event.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [reset]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlayer((current) => {
        if (message) return current;
        const left = keys.current.ArrowLeft || keys.current.a || touch.current.left;
        const right = keys.current.ArrowRight || keys.current.d || touch.current.right;
        const jump = keys.current.ArrowUp || keys.current.w || keys.current[" "] || touch.current.jump;
        const next = { ...current, vx: left ? -current.speed : right ? current.speed : 0 };
        if (next.vx !== 0) next.facing = next.vx < 0 ? -1 : 1;
        if (jump && next.onGround) { next.vy = -next.jumpPower; next.onGround = false; }
        next.vy += 0.65;
        next.x += next.vx;
        next.y += next.vy;
        next.onGround = false;

        for (const block of INITIAL_BLOCKS) {
          if (!intersects(next, block)) continue;
          if (next.vy >= 0 && current.y + current.h <= block.y + 8) {
            next.y = block.y - next.h; next.vy = 0; next.onGround = true;
          } else if (next.vy < 0 && current.y >= block.y + block.h - 8) {
            next.y = block.y + block.h; next.vy = 0;
          }
        }
        if (next.y > CANVAS_HEIGHT + 100) {
          next.lives -= 1; next.x = 90; next.y = 370; next.vx = 0; next.vy = 0;
          if (next.lives <= 0) setMessage("Game over — press R");
        }
        if (intersects(next, GOAL)) setMessage("You win — press R");
        setCameraX(Math.max(0, Math.min(next.x - CANVAS_WIDTH * 0.35, WORLD_WIDTH - CANVAS_WIDTH)));
        return next;
      });
      setCoins((current) => current.map((coin) => coin.collected ? coin : ({ ...coin, collected: Math.abs(player.x + player.w / 2 - coin.x) < 25 && Math.abs(player.y + player.h / 2 - coin.y) < 25 })));
    }, 1000 / 60);
    return () => window.clearInterval(timer);
  }, [message, player.x, player.y]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) drawScene(ctx, player, coins, enemies, cameraX);
  }, [player, coins, enemies, cameraX]);

  const setControl = (name: keyof TouchState, value: boolean) => {
    touch.current[name] = value;
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#7ad6ff" }}>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: "100%", height: "100%", touchAction: "none" }} />
      {(["left", "right"] as const).map((control) => (
        <button key={control} onPointerDown={() => setControl(control, true)} onPointerUp={() => setControl(control, false)} onPointerLeave={() => setControl(control, false)} style={{ position: "absolute", bottom: 24, left: control === "left" ? 20 : 112, width: 76, height: 76, borderRadius: "50%", fontSize: 28, background: "#0008", color: "white" }}>{control === "left" ? "◀" : "▶"}</button>
      ))}
      <button onPointerDown={() => setControl("jump", true)} onPointerUp={() => setControl("jump", false)} onPointerLeave={() => setControl("jump", false)} style={{ position: "absolute", right: 20, bottom: 24, width: 88, height: 88, borderRadius: "50%", fontSize: 28, background: "#0008", color: "white" }}>▲</button>
    </div>
  );
}
