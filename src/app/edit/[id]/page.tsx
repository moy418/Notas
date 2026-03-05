"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { AddressAutofill } from '@mapbox/search-js-react';

export default function EditInvoice() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        date: '',
        customer: {
            name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            email: ''
        },
        items: [{ description: '', sku: '', quantity: 1, price: 0, amount: 0 }],
        taxLocation: 'texas',
        paymentMethod: 'cash',
        financingCompany: '',
        notes: '',
        status: 'paid'
    });

    useEffect(() => {
        async function fetchInvoice() {
            try {
                const res = await fetch(`/api/invoices/${invoiceId}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setFormData(data.data);
                } else {
                    alert("Invoice not found.");
                    router.push('/history');
                }
            } catch (err) {
                console.error("Failed to fetch invoice", err);
                alert("Error fetching invoice.");
            } finally {
                setFetching(false);
            }
        }
        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId, router]);

    const getTaxRate = (location: string) => {
        switch (location) {
            case 'texas': return 0.0825;
            case 'new_mexico': return 0.07;
            default: return 0;
        }
    };

    const calculateTotals = (items: any[], taxLoc: string) => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const tax = subtotal * getTaxRate(taxLoc);
        return { subtotal, tax, total: subtotal + tax };
    };

    const totals = calculateTotals(formData.items, formData.taxLocation);

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            customer: { ...formData.customer, [e.target.name]: e.target.value }
        });
    };

    const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newItems = [...formData.items];
        const { name, value } = e.target;

        // @ts-ignore
        newItems[index][name] = name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value;
        newItems[index].amount = newItems[index].quantity * newItems[index].price;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', sku: '', quantity: 1, price: 0, amount: 0 }]
        });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...formData,
            ...totals
        };

        try {
            const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                router.push('/history');
            } else {
                alert("Failed to update invoice.");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating invoice.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="dashboard-layout fade-in">
                <Sidebar />
                <main className="main-content">
                    <div className="loading-state">Loading invoice details...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout fade-in">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1>Edit Invoice</h1>
                    <p>Update details for {formData.invoiceNumber}</p>
                </header>

                <form onSubmit={handleSubmit} className="invoice-form glass-panel">
                    <div className="form-section">
                        <h3>Bill To</h3>
                        <div className="grid-2">
                            <input required name="name" value={formData.customer?.name || ''} placeholder="Customer Name" className="premium-input" onChange={handleCustomerChange} />
                            <input name="phone" value={formData.customer?.phone || ''} placeholder="Phone Number" className="premium-input" onChange={handleCustomerChange} />

                            <div className="col-span-2">
                                <AddressAutofill
                                    accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
                                    popoverOptions={{ flip: true, offset: 5 }}
                                >
                                    <input
                                        name="address"
                                        value={formData.customer?.address || ''}
                                        placeholder="Address"
                                        className="premium-input w-full"
                                        onChange={handleCustomerChange}
                                        autoComplete="address-line1"
                                    />
                                </AddressAutofill>
                            </div>

                            <input
                                name="city"
                                value={formData.customer?.city || ''}
                                placeholder="City"
                                className="premium-input"
                                onChange={handleCustomerChange}
                                autoComplete="address-level2"
                            />
                            <input
                                name="state"
                                value={formData.customer?.state || ''}
                                placeholder="State/Province"
                                className="premium-input"
                                onChange={handleCustomerChange}
                                autoComplete="address-level1"
                            />
                            <input
                                name="zip"
                                value={formData.customer?.zip || ''}
                                placeholder="Zip/Postal Code"
                                className="premium-input"
                                onChange={handleCustomerChange}
                                autoComplete="postal-code"
                            />
                            <input name="email" value={formData.customer?.email || ''} type="email" placeholder="Email Address" className="premium-input" onChange={handleCustomerChange} />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Items</h3>
                        <div className="items-list">
                            {formData.items.map((item, index) => (
                                <div key={index} className="item-row">
                                    <input name="description" placeholder="Description" className="premium-input" value={item.description} onChange={(e) => handleItemChange(index, e)} required />
                                    <input name="sku" placeholder="SKU" className="premium-input" value={item.sku} onChange={(e) => handleItemChange(index, e)} />
                                    <input name="quantity" type="number" min="1" placeholder="Qty" className="premium-input w-24" value={item.quantity || ''} onChange={(e) => handleItemChange(index, e)} required />
                                    <input name="price" type="number" step="0.01" placeholder="Price" className="premium-input w-32" value={item.price || ''} onChange={(e) => handleItemChange(index, e)} required />
                                    <div className="item-amount">${item.amount.toFixed(2)}</div>
                                    {formData.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="remove-btn">×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="premium-button secondary mt-4">+ Add Item</button>
                    </div>

                    <div className="form-footer">
                        <div className="invoice-settings">
                            <div className="input-group">
                                <label>Tax Location</label>
                                <select className="premium-input" value={formData.taxLocation} onChange={(e) => setFormData({ ...formData, taxLocation: e.target.value })}>
                                    <option value="texas">Texas (8.25%)</option>
                                    <option value="new_mexico">New Mexico (7%)</option>
                                    <option value="none">Tax Exempt (0%)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Payment Method</label>
                                <select className="premium-input" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit Card</option>
                                    <option value="financing">Financing</option>
                                    <option value="check">Check</option>
                                    <option value="zelle">Zelle</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Invoice Status</label>
                                <select className="premium-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="paid">Paid (Pagado)</option>
                                    <option value="pending">Pending (Pendiente)</option>
                                </select>
                            </div>
                            {formData.paymentMethod === 'financing' && (
                                <div className="input-group">
                                    <label>Financing Company</label>
                                    <input name="financingCompany" value={formData.financingCompany || ''} placeholder="E.g. Snap Finance" className="premium-input" onChange={(e) => setFormData({ ...formData, financingCompany: e.target.value })} />
                                </div>
                            )}
                            <div className="input-group">
                                <label>Notes / Comments</label>
                                <textarea
                                    name="notes"
                                    rows={3}
                                    placeholder="Add any additional notes (e.g. delivery date, specific terms...)"
                                    className="premium-input"
                                    style={{ resize: 'vertical' }}
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="invoice-totals">
                            <div className="total-row"><span>Subtotal:</span> <span>${totals.subtotal.toFixed(2)}</span></div>
                            <div className="total-row"><span>Tax:</span> <span>${totals.tax.toFixed(2)}</span></div>
                            <div className="total-row grand-total"><span>Total:</span> <span>${totals.total.toFixed(2)}</span></div>

                            <button type="submit" className="premium-button w-full mt-4" disabled={loading}>
                                {loading ? 'Saving...' : 'Update Invoice'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
