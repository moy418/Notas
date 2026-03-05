import { NextResponse } from 'next/server';
import { getAllInvoices, createInvoice, initDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        initDb();
        const invoices = getAllInvoices();
        return NextResponse.json({ success: true, data: invoices });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        initDb();
        const payload = await request.json();
        const invoiceId = uuidv4();

        // In our payload we usually have invoiceNumber, let's make sure it exists
        if (!payload.invoiceNumber) {
            payload.invoiceNumber = `INV-${Math.floor(10000000 + Math.random() * 90000000)}`;
        }

        const newInvoice = createInvoice(invoiceId, payload);
        return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        initDb();
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 });
        }

        const db = require('@/lib/db').getDb();

        // Fetch the existing record
        const stmt = db.prepare('SELECT data FROM invoices WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        // Update the JSON data
        let data = JSON.parse(row.data);
        data.status = status;

        // Save it back
        const updateStmt = db.prepare('UPDATE invoices SET data = ?, updated_at = ? WHERE id = ?');
        const now = new Date().toISOString();
        updateStmt.run(JSON.stringify(data), now, id);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
