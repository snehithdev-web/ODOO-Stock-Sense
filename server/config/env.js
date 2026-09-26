import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the .env location relative to this file instead of process.cwd(),
// so loading works regardless of the directory the server was started from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(serverRoot, '.env') });
