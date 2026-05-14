import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Upload, Image as ImageIcon, Loader2, Heart, Trash2, Plus, Play, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadVideoToDrive } from '../lib/uploadVideo';
import './Pages.css';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'school', label: 'Trường lớp' },
  { key: 'trip', label: 'Dã ngoại' },
  { key: 'hangout', label: 'Tụ tập' },
  { key: 'event', label: 'Sự kiện' },
  { key: 'other', label: 'Khác' },
];

// Giới hạn file
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;    // 5MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;  // 200MB
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Helper: URL thumbnail + preview của Drive
const driveThumbnail = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
const drivePreview = (id) => `https://drive.google.com/file/d/${id}/preview`;

const Gallery = () => {
  const { member, isAdmin } = useAuth();
  const [items, setItems] = useState([]);          // merge ảnh + video, mỗi item có .type
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadData, setUploadData] = useState({ caption: '', category: 'other' });
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileKind, setFileKind] = useState(null);  // 'image' | 'video'
  const fileRef = useRef(null);

  useEffect(() => { fetchItems(); }, []);

  // ── Fetch cả ảnh (gallery) và video (videos), merge lại ──
  async function fetchItems() {
    setLoading(true);
    try {
      const [galleryRes, videosRes] = await Promise.all([
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
        supabase.from('videos').select('*').order('created_at', { ascending: false }),
      ]);

      const images = (galleryRes.data || []).map(img => ({ ...img, type: 'image' }));
      const videos = (videosRes.data || []).map(vid => ({ ...vid, type: 'video' }));

      // Trộn lại, sắp theo created_at giảm dần
      const merged = [...images, ...videos].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setItems(merged);
    } catch (e) {
      console.warn('Gallery fetch error:', e);
    }
    setLoading(false);
  }

  // ── Chọn file: nhận diện ảnh hay video ──
  function handleFileSelect(file) {
    if (!file) return;

    if (IMAGE_TYPES.includes(file.type)) {
      if (file.size > MAX_IMAGE_SIZE) { alert('Ảnh tối đa 5MB!'); return; }
      setFileKind('image');
    } else if (VIDEO_TYPES.includes(file.type)) {
      if (file.size > MAX_VIDEO_SIZE) { alert('Video tối đa 200MB!'); return; }
      setFileKind('video');
    } else {
      alert('Chỉ chấp nhận ảnh (JPEG/PNG/WebP/GIF) hoặc video (MP4/MOV/WebM)!');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  // ── Upload: route theo loại file ──
  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile || !member) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      if (fileKind === 'video') {
        // ─── VIDEO: upload lên Google Drive qua Edge Function ───
        const driveFileId = await uploadVideoToDrive(selectedFile, setUploadProgress);

        const { data, error } = await supabase
          .from('videos')
          .insert({
            drive_file_id: driveFileId,
            caption: uploadData.caption,
            category: uploadData.category,
            uploaded_by: member.mshs,
            uploaded_by_name: member.full_name,
            likes: 0,
          })
          .select()
          .single();

        if (error) throw error;
        setItems(prev => [{ ...data, type: 'video' }, ...prev]);
      } else {
        // ─── ẢNH: upload lên Supabase Storage (như cũ) ───
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
        setItems(prev => [{ ...data, type: 'image' }, ...prev]);
      }

      // Reset form
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileKind(null);
      setUploadData({ caption: '', category: 'other' });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Lỗi upload: ' + (err.message || 'Vui lòng thử lại'));
    }
    setUploading(false);
    setUploadProgress(0);
  }

  // ── Like: route theo loại ──
  async function handleLike(item) {
    const table = item.type === 'video' ? 'videos' : 'gallery';
    setItems(prev => prev.map(it =>
      it.id === item.id && it.type === item.type
        ? { ...it, likes: (it.likes || 0) + 1 }
        : it
    ));
    try {
      await supabase.from(table).update({ likes: (item.likes || 0) + 1 }).eq('id', item.id);
    } catch (e) { /* ignore */ }
  }

  // ── Delete: route theo loại ──
  async function handleDelete(item) {
    if (!confirm(`Xóa ${item.type === 'video' ? 'video' : 'ảnh'} này?`)) return;
    const table = item.type === 'video' ? 'videos' : 'gallery';
    try {
      await supabase.from(table).delete().eq('id', item.id);
      setItems(prev => prev.filter(it => !(it.id === item.id && it.type === item.type)));
      setLightbox(null);
    } catch (e) { console.error(e); }
  }

  const filtered = filter === 'all' ? items : items.filter(it => it.category === filter);

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
            <Plus size={18} /> Thêm Ảnh / Video
          </motion.button>
        </div>
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !uploading && setShowUpload(false)}>
            <motion.div className="modal-content glass upload-modal" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} onClick={e => e.stopPropagation()}>
              {!uploading && (
                <button className="modal-close" onClick={() => setShowUpload(false)}><X size={24} /></button>
              )}
              <h2 className="form-title">Thêm Ảnh / Video Kỷ Niệm</h2>

              <form onSubmit={handleUpload} className="write-form">
                {/* Drop zone / preview */}
                {previewUrl ? (
                  <div className="upload-preview-container">
                    {fileKind === 'video' ? (
                      <video src={previewUrl} className="upload-preview-img" controls />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="upload-preview-img" />
                    )}
                    {!uploading && (
                      <button type="button" className="upload-remove-btn" onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFileKind(null); }}>
                        <X size={14} /> Bỏ file
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Film size={40} style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
                    <p><strong>Kéo thả ảnh hoặc video vào đây</strong></p>
                    <p className="upload-hint">hoặc nhấn để chọn file • Ảnh tối đa 5MB • Video tối đa 200MB</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                      onChange={e => handleFileSelect(e.target.files?.[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Mô tả</label>
                  <input type="text" placeholder="VD: Dã ngoại Đà Lạt 2025" value={uploadData.caption} onChange={e => setUploadData(p => ({ ...p, caption: e.target.value }))} disabled={uploading} />
                </div>

                <div className="form-group">
                  <label>Danh mục</label>
                  <select className="form-select" value={uploadData.category} onChange={e => setUploadData(p => ({ ...p, category: e.target.value }))} disabled={uploading}>
                    {CATEGORIES.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>

                {/* Progress bar khi upload video */}
                {uploading && fileKind === 'video' && (
                  <div className="upload-progress-wrap">
                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                    <span className="upload-progress-text">{uploadProgress}%</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading || !selectedFile}>
                  {uploading
                    ? <><Loader2 size={18} className="spin-icon" /> {fileKind === 'video' ? 'Đang tải video lên Drive...' : 'Đang tải lên...'}</>
                    : <><Upload size={18} /> Tải Lên</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <Loader2 size={32} className="spin-icon" style={{ color: 'var(--ptnk-blue)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state text-center">
          <ImageIcon size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>Chưa có ảnh/video nào{filter !== 'all' ? ' trong danh mục này' : ''}. Hãy thêm kỷ niệm đầu tiên!</p>
        </div>
      ) : (
        <motion.div className="gallery-masonry" variants={containerVariants} initial="hidden" animate="show" key={filter}>
          {filtered.map(item => (
            <motion.div key={`${item.type}-${item.id}`} className="gallery-item" variants={itemVariants}>
              {item.type === 'video' ? (
                <>
                  <img
                    src={driveThumbnail(item.drive_file_id)}
                    alt={item.caption}
                    loading="lazy"
                    onClick={() => setLightbox(item)}
                    onError={(e) => { e.target.style.background = '#1a202c'; e.target.src = ''; }}
                  />
                  <div className="video-play-badge" onClick={() => setLightbox(item)}>
                    <Play size={28} fill="white" />
                  </div>
                </>
              ) : (
                <img src={item.image_url} alt={item.caption} loading="lazy" onClick={() => setLightbox(item)} />
              )}

              <div className="gallery-overlay" onClick={() => setLightbox(item)}>
                <div className="gallery-overlay-content">
                  {item.type === 'video' ? <Play className="gallery-zoom-icon" size={24} /> : <ZoomIn className="gallery-zoom-icon" size={24} />}
                  {item.caption && <span className="gallery-caption">{item.caption}</span>}
                </div>
              </div>

              <div className="gallery-actions">
                <button className="gallery-like-btn" onClick={e => { e.stopPropagation(); handleLike(item); }}>
                  <Heart size={14} /> {item.likes || 0}
                </button>
                {(isAdmin || item.uploaded_by === member?.mshs) && (
                  <button className="gallery-delete-btn" onClick={e => { e.stopPropagation(); handleDelete(item); }}>
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
            <motion.div className="lightbox-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={28} /></button>

              {lightbox.type === 'video' ? (
                <iframe
                  src={drivePreview(lightbox.drive_file_id)}
                  title={lightbox.caption || 'Video'}
                  className="lightbox-video"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <img src={lightbox.image_url} alt={lightbox.caption} />
              )}

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