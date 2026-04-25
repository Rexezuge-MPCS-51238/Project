import { useCallback, useEffect, useState } from 'react';
import AccountList from '../components/AccountList';
import AdminPage from '../components/AdminPage';
import Unauthorized from '../components/Unauthorized';

type View = 'accounts' | 'admin';

function parseRoute(): { view: View } {
  const path: string = window.location.pathname.replace(/\/$/, '') || '/';
  return { view: path === '/admin' ? 'admin' : 'accounts' };
}

export default function SpaApp() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [currentView, setCurrentView] = useState<View>(() => parseRoute().view);
  const [showHidden, setShowHidden] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('aws-access-bridge-page-size');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('aws-access-bridge-current-page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalAccounts, setTotalAccounts] = useState(0);

  const navigateTo = useCallback((view: View) => {
    setCurrentView(view);
    const path = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== path) {
      history.pushState(null, '', path);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setCurrentView(parseRoute().view);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('aws-access-bridge-page-size', pageSize.toString());
  }, [pageSize]);

  useEffect(() => {
    sessionStorage.setItem('aws-access-bridge-current-page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.status === 401) {
          setIsAuthorized(false);
        } else if (response.ok) {
          const userData = (await response.json()) as { isSuperAdmin?: boolean; email?: string };
          setIsAuthorized(true);
          setIsSuperAdmin(userData.isSuperAdmin || false);
          setUserEmail(userData.email || '');
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    };
    void checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen && !(event.target as Element).closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  if (isAuthorized === null) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '2px solid #60a5fa',
              borderTopColor: 'transparent',
              margin: '0 auto 16px',
            }}
          />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Unauthorized />;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <SpaNavbar isSuperAdmin={isSuperAdmin} currentView={currentView} setCurrentView={navigateTo} userEmail={userEmail} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div key={currentView} className="animate-fade-in-up">
          {currentView === 'admin' && isSuperAdmin ? (
            <AdminPage />
          ) : (
            <>
              <div className="flex items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold flex-shrink-0 text-gray-100">AWS Accounts</h2>
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by account id or nickname"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-white placeholder-gray-500 focus:outline-none"
                    style={{
                      paddingLeft: '40px',
                      paddingRight: '16px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      background: '#1e2433',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div className="relative filter-dropdown flex-shrink-0">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
                    style={{ padding: '10px 12px', background: '#1e2433', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Filters
                  </button>
                  {filterOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 shadow-xl z-10 animate-slide-down"
                      style={{ background: '#1e2433', borderRadius: '8px' }}
                    >
                      <div className="p-3">
                        <label className="flex items-center cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={showHidden}
                            onChange={(event) => {
                              setShowHidden(event.target.checked);
                              setCurrentPage(1);
                            }}
                            className="mr-2.5 rounded"
                          />
                          Include Hidden
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <PaginationBar
                currentPage={currentPage}
                pageSize={pageSize}
                searchTerm={searchTerm}
                totalAccounts={totalAccounts}
                setCurrentPage={setCurrentPage}
                setPageSize={setPageSize}
              />
              <AccountList
                showHidden={showHidden}
                searchTerm={searchTerm}
                pageSize={pageSize}
                currentPage={currentPage}
                setTotalAccounts={setTotalAccounts}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaginationBar({
  currentPage,
  pageSize,
  searchTerm,
  totalAccounts,
  setCurrentPage,
  setPageSize,
}: {
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  totalAccounts: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}) {
  if (searchTerm.trim()) return null;
  const totalPages = Math.ceil(totalAccounts / pageSize);

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Per page:</label>
        <select
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
          className="text-white text-sm focus:outline-none"
          style={{ padding: '6px 8px', background: '#252d3d', borderRadius: '6px', border: 'none' }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      {totalAccounts > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {Math.min((currentPage - 1) * pageSize + 1, totalAccounts)}-{Math.min(currentPage * pageSize, totalAccounts)} of {totalAccounts}
          </span>
          {totalPages > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded bg-gray-800 px-3 py-1 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded bg-gray-800 px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SpaNavbar({
  isSuperAdmin,
  currentView,
  setCurrentView,
  userEmail,
}: {
  isSuperAdmin: boolean;
  currentView: View;
  setCurrentView: (view: View) => void;
  userEmail: string;
}) {
  return (
    <nav
      className="text-white flex justify-between items-center"
      style={{ padding: '12px 24px', background: 'rgba(17, 24, 39, 0.95)', borderBottom: '1px solid #1e2433' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>
          <span style={{ color: '#60a5fa' }}>AWS</span> AccessBridge
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(30,36,51,0.5)', padding: '4px', borderRadius: '8px' }}>
          <NavTab active={currentView === 'accounts'} onClick={() => setCurrentView('accounts')}>
            Accounts
          </NavTab>
          {isSuperAdmin && (
            <NavTab active={currentView === 'admin'} onClick={() => setCurrentView('admin')}>
              Admin
            </NavTab>
          )}
        </div>
      </div>
      <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isSuperAdmin && (
          <span
            style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px' }}
          >
            ADMIN
          </span>
        )}
        <span style={{ color: '#9ca3af' }}>{userEmail}</span>
      </div>
    </nav>
  );
}

function NavTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        background: active ? '#2563eb' : 'transparent',
        color: active ? '#fff' : '#9ca3af',
      }}
    >
      {children}
    </button>
  );
}
