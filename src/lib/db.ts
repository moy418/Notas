import Database from 'better-sqlite3';
import path from 'path';

// Using process.cwd() ensures it points to the Next.js root
const dbPath = path.join(process.cwd(), 'data', 'invoices.db');

let db: Database.Database | null = null;

export function getDb() {
    if (!db) {
        db = new Database(dbPath, {
            // verbose: console.log 
        });
    }
    return db;
}

export interface InvoiceRecord {
    id: string;
    data: string; // JSON string
    created_at: string;
    updated_at: string;
}

// Ensure the table exists (it should, since we copied the backup)
export function initDb() {
    const database = getDb();
    database.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Helpers
export function getAllInvoices(): any[] {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM invoices ORDER BY created_at DESC');
    const rows = stmt.all() as InvoiceRecord[];

    // Parse the JSON data on the fly
    return rows.map(row => {
        try {
            return JSON.parse(row.data);
        } catch (e) {
            console.error(`Error parsing invoice ${row.id}`, e);
            return null;
        }
    }).filter(Boolean);
}

export function createInvoice(invoiceId: string, payload: any) {
    const database = getDb();
    const stmt = database.prepare('INSERT INTO invoices (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)');
    const now = new Date().toISOString();
    // Using the actual payload provided or defaulting to ID inside payload
    const invoiceData = { ...payload, id: invoiceId, createdAt: now };

    stmt.run(invoiceId, JSON.stringify(invoiceData), now, now);
    return invoiceData;
}

export function deleteInvoice(invoiceId: string) {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM invoices WHERE id = ?');
    stmt.run(invoiceId);
}

export function clearAllInvoices() {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM invoices');
    stmt.run();
}
