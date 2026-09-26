import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the .env location relative to this file instead of process.cwd(),
// so loading works regardless of the directory the server was started from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

// dotenv never overwrites a variable that is already set, so loading the repo
// root first makes it a fallback that server/.env is still able to override.
dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

// Fail fast when the signing key is missing. This previously fell back to a
// value hardcoded in utils/jwt.js, so a checkout without a configured
// JWT_SECRET silently signed and accepted tokens using a publicly known key.
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Add it to server/.env (see server/.env.example) ' +
      'before starting the server.'
  );
}
