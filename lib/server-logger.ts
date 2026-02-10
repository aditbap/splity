
import fs from 'fs';
import path from 'path';

export function logDebug(message: string) {
    const logFile = path.join(process.cwd(), 'server_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}
