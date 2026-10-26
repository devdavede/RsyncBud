const FLAG_OPTIONS = [
  ['compress', '-z'],
  ['move', '--remove-source-files'],
  ['delete', '--delete'],
  ['update', '-u'],
  ['dryrun', '-n'],
  ['progress', '-P'],
  ['checksum', '-c'],
  ['ignoreExisting', '--ignore-existing'],
  ['hardLinks', '-H'],
  ['pruneEmpty', '-m'],
  ['inplace', '--inplace'],
  ['xattrs', '-X'],
  ['acls', '-A']
];

/**
 * Translates the renderer's checkbox state into an rsync argument list.
 * Remote (user@host:/path) targets get -e ssh appended automatically.
 */
function buildRsyncArgs(options, target) {
  const args = ['-av'];

  if (target.includes(':') && !target.startsWith('/')) {
    args.push('-e', 'ssh -o StrictHostKeyChecking=accept-new');
  }

  for (const [optionKey, flag] of FLAG_OPTIONS) {
    if (options[optionKey]) args.push(flag);
  }

  return args;
}

module.exports = { buildRsyncArgs };
