import { NextResponse } from 'next/server';
import { getAllInvoices, clearAllInvoices, createInvoice, initDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        initDb();
        const invoices = getAllInvoices();

        // Return a response designed to trigger a file download natively
        return new NextResponse(JSON.stringify(invoices, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="epfs_invoice_backup.json"'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        initDb();

        const backupData = await request.json();

        if (!Array.isArray(backupData)) {
            return NextResponse.json({ success: false, error: "Invalid backup file format" }, { status: 400 });
        }

        clearAllInvoices();

        // Re-insert all invoices
        for (const invoice of backupData) {
            // Re-use existing ID if it has one, otherwise generate
            const idToUse = invoice.id || uuidv4();
            createInvoice(idToUse, invoice);
        }

        return NextResponse.json({ success: true, message: "Backup restored successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
