/**
 * 3000 포트 비우고 lock 제거 후 next dev 실행
 * 터미널에서 npm run dev:3000 으로 실행
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const lockPath = path.join(__dirname, "..", ".next", "dev", "lock");

// 1. lock 파일 삭제
try {
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log("Removed .next/dev/lock");
  }
} catch (e) {
  // ignore
}

// 2. Windows: 3000 포트 사용 프로세스 종료
const isWin = process.platform === "win32";
if (isWin) {
  try {
    const result = execSync('netstat -ano | findstr :3000', { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
    const lines = result.trim().split("\n");
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Killed process ${pid} (was using port 3000)`);
      } catch (_) {}
    }
  } catch (_) {
    // netstat found nothing or failed
  }
}

// 3. next dev 실행 (기본 3000 포트)
const child = spawn(isWin ? "npm.cmd" : "npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});
child.on("exit", (code) => process.exit(code || 0));
