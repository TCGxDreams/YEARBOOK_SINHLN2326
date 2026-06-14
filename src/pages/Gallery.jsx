import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ZoomIn, Upload, Image as ImageIcon, Heart, Trash2, Plus, Play, Film, Loader2,
  ChevronLeft, ChevronRight,                       // ⭐ lightbox nav
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { uploadVideoToDrive } from '../lib/uploadVideo';
import { uploadPhoto, getPhotoSrc } from '../lib/uploadPhoto';
import { GallerySkeleton } from '../components/Skeleton';
import './Pages.css';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'school', label: 'Trường lớp' },
  { key: 'trip', label: 'Dã ngoại' },
  { key: 'hangout', label: 'Tụ tập' },
  { key: 'event', label: 'Sự kiện' },
  { key: 'other', label: 'Khác' },
];

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Swipe threshold (px)
const SWIPE_THRESHOLD = 60;

const driveThumbnail = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
const drivePreview = (id) => `https://drive.google.com/file/d/${id}/preview`;

const Gallery = () => {
  const { member, isAdmin } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadData, setUploadData] = useState({ caption: '', category: 'other' });
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileKind, setFileKind] = useState(null);
  const fileRef = useRef(null);
  const touchStartX = useRef(null);                  // ⭐ swipe state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedItems, setLikedItems] = useState([]);

  const filtered = filter === 'all' ? items : items.filter(it => it.category === filter);

  // ════════════════════════════════════════════════════════════
  // Fetch + Realtime
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    // Load liked items from localStorage
    const saved = localStorage.getItem('liked_gallery_items');
    if (saved) {
      try {
        setLikedItems(JSON.parse(saved));
      } catch (e) {
        setLikedItems([]);
      }
    }

    setPage(0);
    fetchItems(0, true);

    const galleryChannel = supabase
      .channel('gallery-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'gallery' },
        (payload) => handleRealtimeChange(payload, 'image')
      )
      .subscribe();

    const videosChannel = supabase
      .channel('videos-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        (payload) => handleRealtimeChange(payload, 'video')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(galleryChannel);
      supabase.removeChannel(videosChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.mshs]);

  function handleRealtimeChange(payload, type) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT') {
      setItems(prev => {
        if (prev.some(it => it.id === newRow.id && it.type === type)) return prev;
        return [{ ...newRow, type }, ...prev];
      });
      if (newRow.uploaded_by !== member?.mshs) {
        const who = newRow.uploaded_by_name || 'Ai đó';
        toast.info(`${who} vừa thêm ${type === 'video' ? 'video' : 'ảnh'} mới!`);
      }
    } else if (eventType === 'DELETE') {
      setItems(prev => prev.filter(it => !(it.id === oldRow.id && it.type === type)));
    } else if (eventType === 'UPDATE') {
      setItems(prev => prev.map(it =>
        it.id === newRow.id && it.type === type ? { ...newRow, type } : it
      ));
    }
  }

  async function fetchItems(pageNum = 0, isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // 12 items per page: range query on both tables
      const from = pageNum * 12;
      const to = from + 11;

      const [galleryRes, videosRes] = await Promise.all([
        supabase.from('gallery').select('*').order('created_at', { ascending: false }).range(from, to),
        supabase.from('videos').select('*').order('created_at', { ascending: false }).range(from, to),
      ]);

      const images = (galleryRes.data || []).map(img => ({ ...img, type: 'image' }));
      const videos = (videosRes.data || []).map(vid => ({ ...vid, type: 'video' }));

      const merged = [...images, ...videos].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      if (pageNum === 0) {
        setItems(merged);
      } else {
        setItems(prev => {
          const existingKeys = new Set(prev.map(it => `${it.type}-${it.id}`));
          const uniqueNew = merged.filter(it => !existingKeys.has(`${it.type}-${it.id}`));
          return [...prev, ...uniqueNew].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        });
      }

      const hasMoreImages = galleryRes.data && galleryRes.data.length === 12;
      const hasMoreVideos = videosRes.data && videosRes.data.length === 12;
      setHasMore(hasMoreImages || hasMoreVideos);

    } catch (e) {
      console.warn('Gallery fetch error:', e);
      toast.error('Không tải được kỷ niệm. Thử lại sau nhé.');
    }
    setLoading(false);
    setLoadingMore(false);
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, false);
  };

  // ════════════════════════════════════════════════════════════
  // ⭐ Lightbox navigation: keyboard + swipe + prefetch
  // ════════════════════════════════════════════════════════════
  const lightboxIndex = lightbox
    ? filtered.findIndex(it => it.id === lightbox.id && it.type === lightbox.type)
    : -1;

  const goToPrev = useCallback(() => {
    if (lightboxIndex > 0) setLightbox(filtered[lightboxIndex - 1]);
  }, [lightboxIndex, filtered]);

  const goToNext = useCallback(() => {
    if (lightboxIndex >= 0 && lightboxIndex < filtered.length - 1) {
      setLightbox(filtered[lightboxIndex + 1]);
    }
  }, [lightboxIndex, filtered]);

  // Keyboard: ←/→/Esc
  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox, goToPrev, goToNext]);

  // Prefetch ảnh kế bên cho mượt
  useEffect(() => {
    if (!lightbox) return;
    const prefetch = (item) => {
      if (!item || item.type !== 'image') return;
      const img = new Image();
      img.src = getPhotoSrc(item, 1920);
    };
    if (lightboxIndex > 0) prefetch(filtered[lightboxIndex - 1]);
    if (lightboxIndex < filtered.length - 1) prefetch(filtered[lightboxIndex + 1]);
  }, [lightbox, lightboxIndex, filtered]);

  // Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goToNext();   // swipe trái → next
      else goToPrev();             // swipe phải → prev
    }
    touchStartX.current = null;
  };

  // ════════════════════════════════════════════════════════════
  // Upload / Like / Delete
  // ════════════════════════════════════════════════════════════
  function handleFileSelect(file) {
    if (!file) return;

    if (IMAGE_TYPES.includes(file.type)) {
      if (file.size > MAX_IMAGE_SIZE) { toast.error('Ảnh tối đa 50MB!'); return; }
      setFileKind('image');
    } else if (VIDEO_TYPES.includes(file.type)) {
      if (file.size > MAX_VIDEO_SIZE) { toast.error('Video tối đa 200MB!'); return; }
      setFileKind('video');
    } else {
      toast.error('Chỉ chấp nhận ảnh (JPEG/PNG/WebP/GIF) hoặc video (MP4/MOV/WebM)!');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile || !member) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('');

    try {
      if (fileKind === 'video') {
        setUploadStatus('Đang tải video lên Drive...');
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
        toast.success('Đã tải video lên!');
      } else {
        setUploadStatus('Đang tải ảnh lên...');
        const result = await uploadPhoto(selectedFile, member.mshs, (progress) => {
          setUploadProgress(progress);
          if (progress > 0 && progress < 100) {
            setUploadStatus('Supabase đầy, đang chuyển sang Drive...');
          }
        });

        const { data, error: dbError } = await supabase
          .from('gallery')
          .insert({
            image_url: result.image_url || null,
            drive_file_id: result.drive_file_id || null,
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
        toast.success(result.source === 'drive' ? 'Đã tải ảnh lên (qua Google Drive)!' : 'Đã tải ảnh lên!');
      }

      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileKind(null);
      setUploadData({ caption: '', category: 'other' });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Lỗi upload: ' + (err.message || 'Vui lòng thử lại'));
    }
    setUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
  }

  async function handleLike(item) {
    const key = `${item.type}-${item.id}`;
    if (likedItems.includes(key)) return;

    const newLiked = [...likedItems, key];
    setLikedItems(newLiked);
    localStorage.setItem('liked_gallery_items', JSON.stringify(newLiked));

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

  async function handleDelete(item) {
    if (!confirm(`Xóa ${item.type === 'video' ? 'video' : 'ảnh'} này?`)) return;
    const table = item.type === 'video' ? 'videos' : 'gallery';
    try {
      await supabase.from(table).delete().eq('id', item.id);
      setItems(prev => prev.filter(it => !(it.id === item.id && it.type === item.type)));
      setLightbox(null);
      toast.success(`Đã xóa ${item.type === 'video' ? 'video' : 'ảnh'}.`);
    } catch (e) {
      console.error(e);
      toast.error('Không xóa được. Thử lại sau.');
    }
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4 } } };

  const hasPrev = lightboxIndex > 0;
  const hasNext = lightboxIndex >= 0 && lightboxIndex < filtered.length - 1;

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

      {/* Upload Modal — giữ nguyên */}
      <AnimatePresence>
        {showUpload && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !uploading && setShowUpload(false)}>
            <motion.div className="modal-content glass upload-modal" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} onClick={e => e.stopPropagation()}>
              {!uploading && (
                <button className="modal-close" onClick={() => setShowUpload(false)}><X size={24} /></button>
              )}
              <h2 className="form-title">Thêm Ảnh / Video Kỷ Niệm</h2>

              <form onSubmit={handleUpload} className="write-form">
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
                    <p className="upload-hint">hoặc nhấn để chọn file • Ảnh tối đa 50MB • Video tối đa 200MB</p>
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

                {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress-wrap">
                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                    <span className="upload-progress-text">{uploadProgress}%</span>
                  </div>
                )}

                {uploading && uploadStatus && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.25rem 0' }}>
                    {uploadStatus}
                  </p>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading || !selectedFile}>
                  {uploading
                    ? <><Loader2 size={18} className="spin-icon" /> Đang tải lên...</>
                    : <><Upload size={18} /> Tải Lên</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <GallerySkeleton count={9} />
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
                <img
                  src={getPhotoSrc(item, 800)}
                  alt={item.caption}
                  loading="lazy"
                  onClick={() => setLightbox(item)}
                  onError={(e) => { e.target.style.background = '#1a202c'; }}
                />
              )}

              <div className="gallery-overlay" onClick={() => setLightbox(item)}>
                <div className="gallery-overlay-content">
                  {item.type === 'video' ? <Play className="gallery-zoom-icon" size={24} /> : <ZoomIn className="gallery-zoom-icon" size={24} />}
                  {item.caption && <span className="gallery-caption">{item.caption}</span>}
                </div>
              </div>

              <div className="gallery-actions">
                <button
                  className={`gallery-like-btn ${likedItems.includes(`${item.type}-${item.id}`) ? 'liked' : ''}`}
                  onClick={e => { e.stopPropagation(); handleLike(item); }}
                  style={{ cursor: likedItems.includes(`${item.type}-${item.id}`) ? 'default' : 'pointer' }}
                >
                  <Heart
                    size={14}
                    fill={likedItems.includes(`${item.type}-${item.id}`) ? '#ef4444' : 'none'}
                    color={likedItems.includes(`${item.type}-${item.id}`) ? '#ef4444' : 'currentColor'}
                  />{' '}
                  {item.likes || 0}
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

      {/* Load More Button */}
      {!loading && hasMore && filtered.length > 0 && (
        <div className="flex-center" style={{ marginTop: '3rem' }}>
          <button
            className="btn btn-outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ minWidth: '150px' }}
          >
            {loadingMore ? (
              <><Loader2 size={16} className="spin-icon" /> Đang tải...</>
            ) : (
              'Tải thêm kỷ niệm'
            )}
          </button>
        </div>
      )}


      {/* ⭐ Lightbox với keyboard + swipe + nav buttons + counter */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Counter top-left */}
            {filtered.length > 1 && (
              <div className="lightbox-counter">
                {lightboxIndex + 1} / {filtered.length}
              </div>
            )}

            {/* Prev button */}
            {hasPrev && (
              <button
                className="lightbox-nav lightbox-nav-prev"
                onClick={e => { e.stopPropagation(); goToPrev(); }}
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Next button */}
            {hasNext && (
              <button
                className="lightbox-nav lightbox-nav-next"
                onClick={e => { e.stopPropagation(); goToNext(); }}
                aria-label="Ảnh kế"
              >
                <ChevronRight size={32} />
              </button>
            )}

            <motion.div
              key={`${lightbox.type}-${lightbox.id}`}
              className="lightbox-content"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="lightbox-close" onClick={() => setLightbox(null)}>
                <X size={28} />
              </button>

              {lightbox.type === 'video' ? (
                <iframe
                  src={drivePreview(lightbox.drive_file_id)}
                  title={lightbox.caption || 'Video'}
                  className="lightbox-video"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <img src={getPhotoSrc(lightbox, 1920)} alt={lightbox.caption} />
              )}

              <div className="lightbox-info">
                {lightbox.caption && <div className="lightbox-caption">{lightbox.caption}</div>}
                {lightbox.uploaded_by_name && <div className="lightbox-author">{lightbox.uploaded_by_name}</div>}
              </div>

              {/* Hint phím tắt (chỉ desktop) */}
              {filtered.length > 1 && (
                <div className="lightbox-hint">
                  ← → để chuyển · Esc để đóng
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;