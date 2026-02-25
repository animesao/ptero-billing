/**
 * Миграция: Добавление колонки ptero_instance_id в таблицу plans
 */

import { db } from './db.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Running migration: add ptero_instance_id to plans table...');

    // Проверяем, существует ли уже колонка
    const result = await db.all(sql`PRAGMA table_info(plans)`);
    console.log('Current columns in plans:', JSON.stringify(result, null, 2));

    const hasColumn = result.some(col => col.name === 'ptero_instance_id');

    if (hasColumn) {
      console.log('Column ptero_instance_id already exists, skipping migration.');
      return;
    }

    // Добавляем колонку
    await db.run(sql`ALTER TABLE plans ADD COLUMN ptero_instance_id TEXT`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
