import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductDetail from './pages/ProductDetail';
import { Activity, LayoutDashboard } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-slate-200 relative overflow-hidden font-sans">
        
        {/* Animated Background Blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-dark-900/60 border-b border-glass-border">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="bg-brand-500/20 p-2 rounded-xl group-hover:bg-brand-500/30 transition-colors">
                  <Activity className="w-6 h-6 text-brand-400" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Price<span className="text-brand-400">Tracker</span>
                </h1>
              </Link>
              <nav>
                <Link to="/" className="flex items-center space-x-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-dark-800/50 hover:bg-dark-800 px-4 py-2 rounded-lg border border-slate-800">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </nav>
            </div>
          </header>
          
          <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/product/:id" element={<ProductDetail />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
