const { spawn } = require('child_process');
const { buildRsyncArgs } = require('./build-args');

function runOne(rsyncArgs, event) {
  return new Promise((resolve) => {
    event.reply('rsync-stdout', `Running: rsync ${rsyncArgs.join(' ')}\n\n`);

    const rsyncProcess = spawn('rsync', rsyncArgs);

    rsyncProcess.stdout.on('data', (data) => {
      event.reply('rsync-stdout', data.toString());
    });

    rsyncProcess.stderr.on('data', (data) => {
      event.reply('rsync-stderr', data.toString());
    });

    rsyncProcess.on('close', (code) => resolve(code ?? 0));

    rsyncProcess.on('error', (err) => {
      event.reply('rsync-stderr', `Process error: ${err.message}\n`);
      resolve(1);
    });
  });
}

/**
 * Runs rsync for the given sources/target, either as one combined invocation
 * or sequentially per source (needed when --remove-source-files should only
 * remove a source once its own transfer has finished).
 */
async function runRsync(event, options) {
  const { sources, target, syncSeparately } = options;

  if (!sources || sources.length === 0) {
    event.reply('rsync-stdout', 'No source files to sync.\n');
    return;
  }

  const baseArgs = buildRsyncArgs(options, target);

  if (syncSeparately) {
    let finalCode = 0;
    for (const source of sources) {
      const code = await runOne([...baseArgs, source, target], event);
      if (code !== 0) finalCode = code;
    }
    event.reply('rsync-exit', finalCode);
  } else {
    const code = await runOne([...baseArgs, ...sources, target], event);
    event.reply('rsync-exit', code);
  }
}

module.exports = { runRsync };
