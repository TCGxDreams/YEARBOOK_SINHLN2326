import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Shield, CheckCircle, ArrowRight } from 'lucide-react';

const Styleguide = () => {
  return (
    <div className="page-container container section">
      <motion.div
        className="page-header text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">UI Styleguide</h1>
        <p className="page-subtitle">Preview design tokens & components</p>
      </motion.div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
        
        {/* Colors */}
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'Be Vietnam Pro', marginBottom: '1rem', color: 'var(--primary-900)' }}>Colors</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ background: 'var(--primary-900)', color: 'white', padding: '1rem', borderRadius: '8px' }}>--primary-900</div>
            <div style={{ background: 'var(--primary-800)', color: 'white', padding: '1rem', borderRadius: '8px' }}>--primary-800</div>
            <div style={{ background: 'var(--primary-700)', color: 'white', padding: '1rem', borderRadius: '8px' }}>--primary-700</div>
            <div style={{ background: 'var(--secondary-500)', color: 'white', padding: '1rem', borderRadius: '8px' }}>--secondary-500</div>
            <div style={{ background: 'var(--secondary-400)', color: 'var(--primary-900)', padding: '1rem', borderRadius: '8px' }}>--secondary-400</div>
          </div>
        </section>

        {/* Typography */}
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'Be Vietnam Pro', marginBottom: '1rem', color: 'var(--primary-900)' }}>Typography</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Be Vietnam Pro' }}>Heading 1</h1>
              <p style={{ color: 'var(--text-muted)' }}>Cormorant Garamond</p>
            </div>
            <div>
              <h2 style={{ fontFamily: 'Be Vietnam Pro' }}>Heading 2</h2>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Be Vietnam Pro' }}>Heading 3</h3>
            </div>
            <div>
              <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: '1rem' }}>Body Text - Be Vietnam Pro. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
            <div>
              <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: '1.5rem', color: 'var(--primary-700)' }}>Handwritten Text - Caveat</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'Be Vietnam Pro', marginBottom: '1rem', color: 'var(--primary-900)' }}>Buttons</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-outline">Outline Button</button>
            <button className="btn btn-ghost">Ghost Button</button>
            <Link to="#" className="btn btn-primary"><ArrowRight size={16} /> Link Button</Link>
          </div>
        </section>

        {/* Cards */}
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'Be Vietnam Pro', marginBottom: '1rem', color: 'var(--primary-900)' }}>Components</h2>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h3>Glass Card</h3>
            <p className="text-secondary" style={{ marginTop: '0.5rem' }}>This is a standard glass card used throughout the application.</p>
          </div>
          
          <div className="search-bar glass" style={{ marginBottom: '1rem' }}>
            <Search size={18} />
            <input type="text" placeholder="Search input..." />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="admin-badge"><Shield size={12} /> Admin Badge</span>
            <span className="save-badge"><CheckCircle size={12} /> Success Badge</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Styleguide;
