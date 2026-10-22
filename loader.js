import { pathToFileURL } from 'node:url';
import path from 'node:path';

const backendRoot = pathToFileURL(path.resolve('.')).href + '/';

export async function resolve(specifier, context, nextResolve) {
  const aliases = {
    '@common/': 'src/common/',
    '@modules/': 'src/modules/',
    '@adapters/': 'src/adapters/',
    '@database/': 'src/database/',
    '@app/': 'src/app/'
  };

  for (const [prefix, target] of Object.entries(aliases)) {
    if (specifier.startsWith(prefix)) {
      const targetSubpath = target + specifier.slice(prefix.length);
      const resolved = new URL(targetSubpath, backendRoot).href;
      return nextResolve(resolved, context);
    }
  }

  return nextResolve(specifier, context);
}

