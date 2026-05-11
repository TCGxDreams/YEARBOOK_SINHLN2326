import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Upload, Image as ImageIcon, Loader2, Heart, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Pages.css';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'school', label: 'Trường lớp' },
  { key: 'trip', label: 'Dã ngoại' },
  { key: 'hangout', label: 'Tụ tập' },
  { key: 'event', label: 'Sự kiện' },
  { key: 'other', label: 'Khác' },
];

const Gallery = () => {
  const { member, isAdmin } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({ caption: '', category: 'other' });
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { fetchImages(); }, []);

  async function fetchImages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && !error) setImages(data);
    } catch (e) {
      console.warn('Gallery fetch error');
    }
    setLoading(false);
  }

  function handleFileSelect(file) {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { alert('Ảnh tối đa 5MB!'); return; }
    const types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!types.includes(file.type)) { alert('Chỉ chấp nhận JPEG, PNG, WebP, GIF!'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile || !member) return;
    setUploading(true);

    try {
      const ext = selectedFile.name.split('.').pop();
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${member.mshs}/${filename}`;

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .upload(path, selectedFile, { contentType: selectedFile.type, cacheControl: '3600' });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);

      const { data, error: dbError } = await supabase
        .from('gallery')
        .insert({
          image_url: urlData.publicUrl,
          caption: uploadData.caption,
          category: uploadData.category,
          uploaded_by: member.mshs,
          uploaded_by_name: member.full_name,
          likes: 0,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setImages(prev => [data, ...prev]);
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadData({ caption: '', category: 'other' });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Lỗi upload: ' + (err.message || 'Vui lòng thử lại'));
    }
    setUploading(false);
  }

  async function handleLike(id) {
    setImages(prev => prev.map(img => img.id === id ? { ...img, likes: (img.likes || 0) + 1 } : img));
    try {
      const img = images.find(i => i.id === id);
      await supabase.from('gallery').update({ likes: (img?.likes || 0) + 1 }).eq('id', id);
    } catch (e) {}
  }

  async function handleDelete(id) {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      await supabase.from('gallery').delete().eq('id', id);
      setImages(prev => prev.filter(img => img.id !== id));
      setLightbox(null);
    } catch (e) { console.error(e); }
  }

  const filtered = filter === 'all' ? images : images.filter(img => img.category === filter);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4 } } };

  return (
    <div className="page-container container section">
      <motion.div
        className="page-header text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="page-title">Kỷ Niệm</h1>
        <p className="page-subtitle">Nơi những khoảnh khắc đẹp nhất được lưu giữ mãi mãi</p>

        <div className="gallery-toolbar">
          <div className="filter-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`filter-tab ${filter === cat.key ? 'active' : ''}`}
                onClick={() => setFilter(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <motion.button
            className="btn btn-primary btn-upload"
            onClick={() => setShowUpload(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} /> Thêm Ảnh
          </motion.button>
        </div>
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpload(false)}>
            <motion.div className="modal-content glass upload-modal" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowUpload(false)}><X size={24} /></button>
              <h2 className="form-title">Thêm Ảnh Kỷ Niệm</h2>

              <form onSubmit={handleUpload} className="write-form">
                {/* Drop zone / preview */}
                {previewUrl ? (
                  <div className="upload-preview-container">
                    <img src={previewUrl} alt="Preview" className="upload-preview-img" />
                    <button type="button" className="upload-remove-btn" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>
                      <X size={14} /> Bỏ ảnh
                    </button>
                  </div>
                ) : (
                  <div
                    className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImageIcon size={40} style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
                    <p><strong>Kéo thả ảnh vào đây</strong></p>
                    <p className="upload-hint">hoặc nhấn để chọn file • Tối đa 5MB</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={e => handleFileSelect(e.target.files?.[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Mô tả</label>
                  <input type="text" placeholder="VD: Dã ngoại Đà Lạt 2025" value={uploadData.caption} onChange={e => setUploadData(p => ({ ...p, caption: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label>Danh mục</label>
                  <select className="form-select" value={uploadData.category} onChange={e => setUploadData(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading || !selectedFile}>
                  {uploading ? <><Loader2 size={18} className="spin-icon" /> Đang tải lên...</> : <><Upload size={18} /> Tải Ảnh Lên</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery */}
      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <Loader2 size={32} className="spin-icon" style={{ color: 'var(--ptnk-blue)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state text-center">
          <ImageIcon size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>Chưa có ảnh nào{filter !== 'all' ? ' trong danh mục này' : ''}. Hãy thêm kỷ niệm đầu tiên!</p>
        </div>
      ) : (
        <motion.div className="gallery-masonry" variants={containerVariants} initial="hidden" animate="show" key={filter}>
          {filtered.map(image => (
            <motion.div key={image.id} className="gallery-item" variants={itemVariants}>
              <img src={image.image_url} alt={image.caption} loading="lazy" onClick={() => setLightbox(image)} />
              <div className="gallery-overlay" onClick={() => setLightbox(image)}>
                <div className="gallery-overlay-content">
                  <ZoomIn className="gallery-zoom-icon" size={24} />
                  {image.caption && <span className="gallery-caption">{image.caption}</span>}
                </div>
              </div>
              <div className="gallery-actions">
                <button className="gallery-like-btn" onClick={e => { e.stopPropagation(); handleLike(image.id); }}>
                  <Heart size={14} /> {image.likes || 0}
                </button>
                {(isAdmin || image.uploaded_by === member?.mshs) && (
                  <button className="gallery-delete-btn" onClick={e => { e.stopPropagation(); handleDelete(image.id); }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="lightbox-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)}>
            <motion.div className="lightbox-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
              <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={28} /></button>
              <img src={lightbox.image_url} alt={lightbox.caption} />
              <div className="lightbox-info">
                {lightbox.caption && <div className="lightbox-caption">{lightbox.caption}</div>}
                {lightbox.uploaded_by_name && <div className="lightbox-author">{lightbox.uploaded_by_name}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
