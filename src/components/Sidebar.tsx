import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: '#fff', borderRadius: '12px', padding: '1rem' }}>
                <img
                    src="/logo.jpg"
                    alt="El Paso Furniture & Style Logo"
                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                />
            </div>
            <nav className="sidebar-nav">
                <Link href="/" className="nav-item">Dashboard</Link>
                <Link href="/create" className="nav-item">Create Invoice</Link>
                <Link href="/history" className="nav-item">History</Link>
            </nav>
            <div className="sidebar-footer">
                <p>Your Comfort, Our Priority</p>
            </div>
        </aside>
    );
}
