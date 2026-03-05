import { NextResponse } from 'next/server';
import { initDb, deleteInvoice } from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        initDb();
        const db = require('@/lib/db').getDb();

        // Next.js 15 treats params as a Promise, await if needed
        const params = await context.params;
        const id = params.id;

        // Search by ID or Invoice Number
        const stmt = db.prepare("SELECT data FROM invoices WHERE id = ? OR json_extract(data, '$.invoiceNumber') = ?");
        const row = stmt.get(id, id) as any;

        if (!row) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        const data = JSON.parse(row.data);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        initDb();
        const db = require('@/lib/db').getDb();
        const params = await context.params;
        const id = params.id;

        const payload = await request.json();

        // Check if invoice exists
        const stmt = db.prepare('SELECT data FROM invoices WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        // Keep the original created_at if it exists
        const oldData = JSON.parse(row.data);
        const updatedData = { ...payload, id, createdAt: oldData.createdAt || payload.createdAt };

        const updateStmt = db.prepare('UPDATE invoices SET data = ?, updated_at = ? WHERE id = ?');
        const now = new Date().toISOString();
        updateStmt.run(JSON.stringify(updatedData), now, id);

        return NextResponse.json({ success: true, data: updatedData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        initDb();
        // Next.js 15 treats params as a Promise
        const params = await context.params;
        const id = params.id;

        deleteInvoice(id);

        return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
