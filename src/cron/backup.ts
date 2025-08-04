import { spawn } from 'child_process';
import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const BACKUP_DIR = path.join(process.cwd(), 'db_backups');

export async function backupDatabase() {
  const {
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DATABASE_URL,
  } = process.env;

  const dbHostMatch = DATABASE_URL?.match(/@([^:/]+)(:\d+)?\//);
  const DB_HOST = dbHostMatch ? dbHostMatch[1] : 'localhost';

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);

  const env = {
    ...process.env,
    PGPASSWORD: DB_PASSWORD || ''
  };

  const dump = spawn('pg_dump', [
    '-U', DB_USER!,
    '-h', DB_HOST!,
    '-F', 'p',
    DB_NAME!,
  ], {
    env,
    shell: true,
  });

  const outStream = fs.createWriteStream(backupFile);

  dump.stdout.pipe(outStream);

  dump.stderr.on('data', (data) => {
    console.error(`pg_dump error: ${data}`);
  });

  dump.on('exit', (code) => {
    if (code === 0) {
      console.log(`✅ Backup completed: ${backupFile}`);
      cleanOldBackups();
    } else {
      console.error(`❌ pg_dump exited with code ${code}`);
    }
  });
}

function cleanOldBackups() {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  fs.readdirSync(BACKUP_DIR).forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted old backup: ${file}`);
    }
  });
}
