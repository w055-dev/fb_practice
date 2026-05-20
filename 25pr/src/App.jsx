import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Home from './pages/Home';
import About from './pages/About'
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>25-я практичка</h1>
        </header>
        
        <nav className="app-nav">
          <Link to="/">Главная</Link>
          <Link to="/about">О нас</Link>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>Сборщик Vite и оптимизация</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;