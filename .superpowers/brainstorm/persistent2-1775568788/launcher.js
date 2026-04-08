const { spawn } = require('child_process');
const path = require('path');
const serverPath = 'C:/Users/nunooliveira/.claude/plugins/cache/superpowers-marketplace/superpowers/5.0.2/skills/brainstorming/scripts/server.js';
const child = spawn(process.execPath, [serverPath], {
  detached: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    BRAINSTORM_DIR: process.env.BRAINSTORM_DIR,
    BRAINSTORM_HOST: '127.0.0.1',
    BRAINSTORM_URL_HOST: 'localhost',
    BRAINSTORM_OWNER_PID: '1'
  }
});
child.unref();
