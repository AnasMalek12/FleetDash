import type { ReactNode } from 'react';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Live map', icon: 'ti-map-2', active: true },
  { label: 'Fleet status', icon: 'ti-truck', active: false },
  { label: 'Alerts', icon: 'ti-bell', active: false },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <i className="ti ti-map-2" />
          </div>
          <span className="navbar-title">FleetDash</span>
        </div>
        <span className="live-badge">Live</span>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <nav>
            <ul>
              {navItems.map((item) => (
                <li key={item.label} className={item.active ? 'active' : ''}>
                  <i className={`ti ${item.icon}`} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
