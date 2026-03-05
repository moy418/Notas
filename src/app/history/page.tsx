"use client";
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

export default function History() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/invoices');
            const data = await res.json();
            if (data.success && data.data) {
                setInvoices(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleMarkAsPaid = async (id: string) => {
        try {
            const res = await fetch('/api/invoices', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'paid' })
            });
            if (res.ok) {
                setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleDelete = async (id: string, invoiceNum: string) => {
        if (!window.confirm(`Are you sure you want to delete invoice ${invoiceNum || id}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setInvoices(invoices.filter(inv => inv.id !== id));
            } else {
                alert('Failed to delete invoice');
            }
        } catch (err) {
            console.error("Failed to delete invoice", err);
            alert('An error occurred while deleting the invoice');
        }
    };

    const formatCurrency = (val: string | number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const backupData = JSON.parse(text);

                if (!Array.isArray(backupData)) {
                    alert("Invalid backup file format. Expected an array of invoices.");
                    return;
                }

                if (window.confirm(`Are you sure you want to restore ${backupData.length} invoices? THIS WILL DELETE ALL CURRENT INVOICES.`)) {
                    setLoading(true);

                    const res = await fetch('/api/backup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(backupData)
                    });

                    const result = await res.json();

                    if (result.success) {
                        alert("Backup restored successfully!");
                        fetchInvoices(); // Refresh the list
                    } else {
                        alert(`Failed to restore backup: ${result.error}`);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error("Error parsing backup file", err);
                alert("Error reading backup file. Please ensure it's a valid JSON.");
            }

            // Reset the input so the same file could be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        // Search by Notes, Customer Name, or Invoice Number
        const searchRegex = new RegExp(searchTerm, 'i');
        const matchesSearch =
            searchRegex.test(inv.notes || '') ||
            searchRegex.test(inv.customer?.name || '') ||
            searchRegex.test(inv.invoiceNumber || '');

        // Filter by Payment Method
        const matchesPayment = paymentFilter === 'all' || inv.paymentMethod?.toLowerCase() === paymentFilter.toLowerCase();

        // Filter by Month (Format: YYYY-MM)
        const matchesMonth = monthFilter === '' || inv.createdAt?.startsWith(monthFilter);

        return matchesSearch && matchesPayment && matchesMonth;
    });

    return (
        <div className="dashboard-layout fade-in">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1>Invoice History</h1>
                    <p>Review all previously generated invoices</p>
                </header>

                <div className="history-container glass-panel">

                    {/* Filters Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="filters-bar" style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by Notes, Customer, or ID..."
                                    className="premium-input w-full"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div style={{ width: '180px' }}>
                                <input
                                    type="month"
                                    className="premium-input w-full"
                                    value={monthFilter}
                                    onChange={e => setMonthFilter(e.target.value)}
                                    title="Filter by Month"
                                />
                            </div>
                            <div style={{ width: '200px' }}>
                                <select
                                    className="premium-input w-full"
                                    value={paymentFilter}
                                    onChange={e => setPaymentFilter(e.target.value)}
                                >
                                    <option value="all">All Payment Methods</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit Card</option>
                                    <option value="financing">Financing</option>
                                    <option value="check">Check</option>
                                    <option value="zelle">Zelle</option>
                                </select>
                            </div>
                        </div>

                        {/* Backup Actions */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <a
                                href="/api/backup"
                                className="premium-button secondary"
                                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                                download="epfs_invoice_backup.json"
                            >
                                Download Backup
                            </a>
                            <button
                                className="premium-button"
                                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', background: '#f59e0b' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Restore Backup
                            </button>
                            <input
                                type="file"
                                accept=".json"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleRestoreBackup}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading history...</div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="empty-state">No invoices match your search.</div>
                    ) : (
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Payment Method</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv, idx) => (
                                    <tr key={inv.id || idx}>
                                        <td className="font-semibold">{inv.invoiceNumber || 'N/A'}</td>
                                        <td>{formatDate(inv.createdAt)}</td>
                                        <td>{inv.customer?.name || 'Unknown'}</td>
                                        <td className="capitalize">{inv.paymentMethod || 'N/A'}</td>
                                        <td className="text-success font-semibold">{formatCurrency(inv.total)}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                backgroundColor: inv.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                color: inv.status === 'pending' ? '#f59e0b' : '#34d399'
                                            }}>
                                                {inv.status === 'pending' ? 'Pending' : 'Paid'}
                                            </span>
                                        </td>
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => window.location.href = `/invoice/${inv.id || inv.invoiceNumber}`}
                                                style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                            >
                                                View / Print
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/edit/${inv.id || inv.invoiceNumber}`}
                                                style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                            >
                                                Edit
                                            </button>
                                            {inv.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(inv.id)}
                                                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
