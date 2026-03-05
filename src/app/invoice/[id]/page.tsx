"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InvoicePrintView() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvoice() {
            try {
                const res = await fetch(`/api/invoices/${params.id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setInvoice(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch invoice", err);
            } finally {
                setLoading(false);
            }
        }
        fetchInvoice();
    }, [params.id]);

    const formatCurrency = (val: string | number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);

    if (loading) return <div className="loading-state">Loading invoice...</div>;
    if (!invoice) return <div className="empty-state">Invoice not found.</div>;

    return (
        <div className="invoice-print-container">
            <div className="no-print print-actions" style={{ padding: '2rem', textAlign: 'center', background: '#0f172a', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={() => window.print()}
                    className="premium-button"
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                >
                    Print / Save as PDF
                </button>
                <button
                    onClick={() => router.push(`/edit/${invoice.id || invoice.invoiceNumber}`)}
                    className="premium-button"
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem', background: '#f59e0b' }}
                >
                    Edit Invoice
                </button>
                <button onClick={() => router.push('/history')} className="premium-button secondary">
                    Back to History
                </button>
            </div>

            <div className="invoice-paper">
                <div className="invoice-header">
                    <img src="/logo.jpg" alt="EPFS Logo" className="print-logo" />
                    <div className="store-details">
                        <h2>EL PASO FURNITURE &amp; STYLE</h2>
                        <p>402 S El Paso St, El Paso, TX 79901</p>
                        <p>Phone: (915) 730-0160</p>
                    </div>
                </div>

                <div className="invoice-title-row">
                    <h1 className="header-invoice-text">INVOICE</h1>
                    <div className="invoice-number-date">
                        <p>Invoice #: {invoice.invoiceNumber}</p>
                        <p>Date: {new Date(invoice.createdAt || invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="invoice-meta">
                    <div className="bill-to">
                        <h3>BILL TO:</h3>
                        <p>{invoice.customer?.name}</p>
                        <p>{invoice.customer?.address}</p>
                        <p>{invoice.customer?.city}, {invoice.customer?.state} {invoice.customer?.zip}</p>
                        <p>Phone: {invoice.customer?.phone}</p>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>SKU</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: any, idx: number) => (
                            <tr key={idx}>
                                <td>{item.description}</td>
                                <td>{item.sku}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.price)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="invoice-footer-container">
                    <div className="invoice-payment-terms">
                        {invoice.notes && (
                            <div className="invoice-notes">
                                <strong>Notes:</strong>
                                <p>{invoice.notes}</p>
                            </div>
                        )}
                        <p><strong>Payment Terms: Due Upon Receipt</strong></p>
                        <p>Payment Method: <span style={{ textTransform: 'capitalize' }}>{invoice.paymentMethod}</span></p>
                        {invoice.financingCompany && <p>Financing: {invoice.financingCompany}</p>}
                    </div>
                    <div className="totals-box">
                        <div className="summary-row"><span>Subtotal:</span> <span>{formatCurrency(invoice.subtotal)}</span></div>
                        <div className="summary-row"><span>Tax (8.25%):</span> <span>{formatCurrency(invoice.tax)}</span></div>
                        <div className="summary-row grand-total"><span>TOTAL:</span> <span>{formatCurrency(invoice.total)}</span></div>
                    </div>
                </div>

                <div className="invoice-footer-thanks">
                    <p>Thank you for your business!</p>
                    <p className="footer-small">(See Terms and Conditions on reverse side)</p>
                </div>
            </div>

            <div className="invoice-paper page-break">
                <div className="invoice-header">
                    <img src="/logo.jpg" alt="EPFS Logo" className="print-logo" />
                </div>

                <h1 className="terms-title">TERMS AND CONDITIONS OF SALE</h1>

                <div className="terms-body">
                    <div className="terms-block">
                        <h4>All Sales Are Final:</h4>
                        <p>We do not accept returns, exchanges, or cancellations once the merchandise has been received. In special cases, the store may approve a cancellation, subject to a 25% fee.</p>
                    </div>

                    <div className="terms-block">
                        <h4>Limited Warranty:</h4>
                        <p>We offer a warranty covering factory defects only. Any defect must be reported immediately upon delivery or pickup. This warranty does not cover damages caused by misuse, accidents, or normal wear and tear.</p>
                    </div>

                    <div className="terms-block">
                        <h4>Inspection:</h4>
                        <p>It is the customer's responsibility to inspect the merchandise upon receipt. By signing this receipt, the customer acknowledges receiving the product in good condition and with all its parts.</p>
                    </div>

                    <div className="terms-block">
                        <h4>Customer Pickup:</h4>
                        <p>El Paso Furniture &amp; Style is not responsible for any damage incurred to the merchandise during transportation if the customer chooses to pick up and transport the items themselves.</p>
                    </div>

                    <hr className="terms-divider" />

                    <h3 className="terms-ack-title">CUSTOMER ACKNOWLEDGMENT</h3>
                    <p className="terms-ack-text">I acknowledge that I have read, understood, and agree to the above Terms and Conditions. I confirm that I have inspected the merchandise and received it in good condition.</p>

                    <div className="signature-section">
                        <div className="sig-box">
                            <div className="sig-line"></div>
                            <p>Customer Signature</p>
                            <div className="sig-line mt-line"></div>
                            <p>Print Name</p>
                        </div>
                        <div className="sig-box">
                            <div className="sig-line"></div>
                            <p>Date</p>
                            <p className="sig-invoice-num">Invoice #: {invoice.invoiceNumber}</p>
                        </div>
                    </div>
                </div>

                <div className="terms-footer">
                    <p>El Paso Furniture &amp; Style | 402 S El Paso St, El Paso, TX 79901 | (915) 730-0160</p>
                </div>
            </div>
        </div>
    );
}
