import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Printer, ChevronLeft, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { localMembers } from '../data/members';
import './Pages.css';

const driveThumbnail = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w600`;

const PrintYearbook = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState('4'); // '2' or '4' members per page

  // Image preloading states
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [preloadingImages, setPreloadingImages] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [totalToPreload, setTotalToPreload] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [membersRes, messagesRes, galleryRes] = await Promise.all([
        supabase.from('members').select('*').order('mshs'),
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
      ]);

      if (membersRes.data && membersRes.data.length > 0) {
        setMembers(membersRes.data);
      } else {
        setMembers(localMembers);
      }
      setMessages(messagesRes.data || []);
      setGallery(galleryRes.data || []);
    } catch (err) {
      console.warn('Could not fetch printable data from Supabase, using local members fallback:', err);
      setMembers(localMembers);
    }
    setLoading(false);
  }

  // Preload images once data is fetched
  useEffect(() => {
    if (loading) return;

    const urls = [];
    members.forEach(m => {
      if (m.avatar_url) urls.push(m.avatar_url);
    });
    gallery.forEach(item => {
      const src = item.image_url || driveThumbnail(item.drive_file_id);
      if (src) urls.push(src);
    });

    if (urls.length === 0) {
      setImagesLoaded(true);
      return;
    }

    setTotalToPreload(urls.length);
    setPreloadingImages(true);
    let loaded = 0;

    const handleImageLoad = () => {
      loaded += 1;
      setPreloadedCount(loaded);
      if (loaded >= urls.length) {
        setImagesLoaded(true);
        setPreloadingImages(false);
      }
    };

    urls.forEach(url => {
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad; // count as loaded to avoid hanging
      img.src = url;
    });

    // Timeout safety fallback
    const timeoutId = setTimeout(() => {
      setImagesLoaded(true);
      setPreloadingImages(false);
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [loading, members, gallery]);

  const handlePrint = () => {
    window.print();
  };

  // Chunk members array into page slices
  const membersPerPage = parseInt(density);
  const memberPages = [];
  for (let i = 0; i < members.length; i += membersPerPage) {
    memberPages.push(members.slice(i, i + membersPerPage));
  }

  // Chunk gallery photos (6 per page)
  const photosPerPage = 6;
  const photoPages = [];
  for (let i = 0; i < gallery.length; i += photosPerPage) {
    photoPages.push(gallery.slice(i, i + photosPerPage));
  }

  // Chunk messages (6 per page)
  const messagesPerPage = 6;
  const messagePages = [];
  for (let i = 0; i < messages.length; i += messagesPerPage) {
    messagePages.push(messages.slice(i, i + messagesPerPage));
  }

  if (loading || (preloadingImages && !imagesLoaded)) {
    return (
      <div className="loading-screen flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={32} className="spin-icon" style={{ color: 'var(--ptnk-blue)' }} />
        <span style={{ fontWeight: 500 }}>
          {loading ? 'Đang chuẩn bị trang in...' : `Đang tối ưu hóa hình ảnh để in (${preloadedCount}/${totalToPreload})...`}
        </span>
      </div>
    );
  }

  return (
    <div className="print-yearbook-container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Top action header (Hidden when printing) */}
      <div className="no-print print-helper-panel glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '2.5rem', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-900)' }}>
              <Printer size={20} />
              Công Cụ Xuất PDF Kỷ Yếu Lớp
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Trang này được định dạng chuyên dụng cho khổ giấy A4 dọc.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bố cục thành viên/trang:</label>
            <select 
              value={density} 
              onChange={e => setDensity(e.target.value)}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', fontSize: '0.85rem' }}
            >
              <option value="2">2 học sinh / trang</option>
              <option value="4">4 học sinh / trang (Tiết kiệm giấy)</option>
            </select>
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Info size={18} style={{ color: 'var(--ptnk-blue)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--primary-900)' }}>Hướng dẫn lưu file PDF đẹp nhất:</strong>
            <ul style={{ marginLeft: '1.25rem', marginTop: '0.25rem', listStyleType: 'disc' }}>
              <li>Nhấn nút <strong>"Quay lại"</strong> ở bên dưới để thoát trang in bất kỳ lúc nào.</li>
              <li>Nhấn <strong>"Lưu PDF / In Kỷ Yếu"</strong>, hộp thoại in của trình duyệt sẽ hiện lên.</li>
              <li>Chọn <strong>Đích đến (Destination):</strong> Lưu dưới dạng PDF (Save as PDF).</li>
              <li>Chọn <strong>Khổ giấy (Paper size):</strong> A4.</li>
              <li>Mở <strong>Cài đặt khác (More settings):</strong> Tích chọn <strong>Đồ họa nền (Background graphics)</strong> để giữ nguyên ảnh và màu sắc. Tắt <strong>Đầu trang và chân trang (Headers and footers)</strong> để xóa các thông tin URL thừa của trình duyệt.</li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/members')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ChevronLeft size={16} /> Quay lại
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Lưu PDF / In Kỷ Yếu
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* PRINT LAYOUT (Designed to fit A4 print sheets) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="print-area">
        
        {/* Style block for Print custom rules */}
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 11pt !important;
            }
            .no-print {
              display: none !important;
            }
            .print-yearbook-container {
              padding: 0 !important;
              max-width: 100% !important;
              margin: 0 !important;
            }
            .print-page {
              page-break-after: always !important;
              position: relative !important;
              width: 210mm !important; /* A4 width */
              height: 297mm !important; /* A4 height */
              padding: 20mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
            }
            .print-cover-page {
              justify-content: center !important;
              align-items: center !important;
              text-align: center !important;
            }
            .print-member-grid {
              display: grid !important;
              grid-template-columns: ${density === '2' ? '1fr' : '1fr 1fr'} !important;
              gap: 1.5rem !important;
              flex: 1 !important;
            }
            .print-member-card {
              border: 1px solid #ddd !important;
              border-radius: 8px !important;
              padding: 1.25rem !important;
              page-break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              background: #fafafa !important;
              box-shadow: none !important;
            }
            .print-gallery-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 1.25rem !important;
              flex: 1 !important;
            }
            .print-gallery-card {
              border: 1px solid #ddd !important;
              border-radius: 8px !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              height: 95mm !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .print-message-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 1.25rem !important;
              flex: 1 !important;
            }
            .print-message-card {
              border: 1px dashed #bbb !important;
              background: #fffef0 !important;
              padding: 1.25rem !important;
              page-break-inside: avoid !important;
              border-radius: 6px !important;
            }
            .print-header-deco {
              border-bottom: 2px solid var(--ptnk-blue) !important;
              margin-bottom: 1.5rem !important;
              padding-bottom: 0.5rem !important;
            }
          }
          
          /* Web display styling for preview helper */
          .print-page {
            background: white;
            border: 1px solid #ddd;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 2rem auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            color: #1a202c;
            border-radius: 4px;
          }
          .print-cover-page {
            justify-content: center;
            align-items: center;
            text-align: center;
            border: 2px solid var(--ptnk-blue);
            background: radial-gradient(circle at top right, rgba(0, 51, 153, 0.05), transparent);
          }
          .print-header-deco {
            border-bottom: 2.5px solid #003399;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .print-header-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #003399;
            text-transform: uppercase;
          }
          .print-header-meta {
            font-size: 0.8rem;
            color: #718096;
            font-weight: 500;
          }
          .print-member-grid {
            display: grid;
            grid-template-columns: ${density === '2' ? '1fr' : '1fr 1fr'};
            gap: 1.5rem;
            flex: 1;
          }
          .print-member-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            background: #f7fafc;
            display: flex;
            flex-direction: column;
          }
          .print-member-avatar {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 1rem;
            border: 2px solid #cbd5e0;
          }
          .print-member-name {
            font-size: 1.15rem;
            font-weight: 750;
            color: #003399;
          }
          .print-member-mshs {
            font-size: 0.75rem;
            color: #718096;
            margin-top: 0.15rem;
            font-weight: 600;
          }
          .print-member-nickname {
            font-size: 0.85rem;
            font-style: italic;
            color: #4a5568;
            margin-top: 0.2rem;
          }
          .print-member-quote {
            font-size: 0.8rem;
            font-style: italic;
            color: #2d3748;
            background: rgba(0,0,0,0.02);
            padding: 0.5rem 0.75rem;
            border-left: 3px solid #003399;
            margin: 0.75rem 0;
            line-height: 1.4;
          }
          .print-member-bio {
            font-size: 0.8rem;
            color: #4a5568;
            line-height: 1.45;
            flex: 1;
          }
          .print-gallery-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            flex: 1;
          }
          .print-gallery-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: #f7fafc;
            height: 95mm;
          }
          .print-gallery-img {
            width: 100%;
            height: 70mm;
            object-fit: cover;
          }
          .print-gallery-info {
            padding: 0.75rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .print-gallery-caption {
            font-size: 0.85rem;
            font-weight: 600;
            color: #2d3748;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .print-gallery-uploader {
            font-size: 0.7rem;
            color: #718096;
            margin-top: 0.25rem;
            font-weight: 550;
          }
          .print-message-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            flex: 1;
          }
          .print-message-card {
            border: 1.5px dashed #cbd5e0;
            background: #fffdf0;
            padding: 1.25rem;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
          }
          .print-message-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            font-weight: 600;
            color: #003399;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            padding-bottom: 0.35rem;
            margin-bottom: 0.5rem;
          }
          .print-message-content {
            font-size: 0.8rem;
            line-height: 1.45;
            color: #2d3748;
            flex: 1;
          }
          .print-message-footer {
            font-size: 0.7rem;
            text-align: right;
            margin-top: 0.5rem;
            color: #718096;
            border-top: 1px solid rgba(0,0,0,0.03);
            padding-top: 0.25rem;
          }
          .print-page-number {
            position: absolute;
            bottom: 10mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 0.8rem;
            color: #718096;
            font-weight: 500;
          }
        `}</style>

        {/* ─── PAGE 1: COVER PAGE ─── */}
        <div className="print-page print-cover-page">
          <div style={{ transform: 'translateY(-20px)' }}>
            <span style={{ fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '4px', color: '#718096', fontWeight: 700 }}>
              Kỷ Yếu Lớp Học
            </span>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 850, color: '#003399', margin: '1rem 0', letterSpacing: '-1px', lineHeight: 1.1 }}>
              12 SINH - LN
            </h1>
            <div style={{ width: '80px', height: '4px', background: '#003399', margin: '1.5rem auto' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Niên Khóa 2023 - 2026
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#718096', marginTop: '4rem', fontWeight: 500 }}>
              Trường Phổ Thông Năng Khiếu<br />
              Đại học Quốc gia Thành phố Hồ Chí Minh
            </p>
          </div>
        </div>

        {/* ─── PAGE 2: FOREWORD ─── */}
        <div className="print-page" style={{ justifyContent: 'center' }}>
          <div className="print-header-deco">
            <span className="print-header-title">Lời Ngỏ</span>
            <span className="print-header-meta">12 SINH-LN</span>
          </div>
          <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'justify', lineHeight: 1.8, fontSize: '0.95rem', color: '#2d3748' }}>
            <p style={{ marginBottom: '1.5rem', textIndent: '2rem' }}>
              Gửi tập thể lớp Sinh-LN thân yêu,
            </p>
            <p style={{ marginBottom: '1.5rem', textIndent: '2rem' }}>
              Ba năm cấp ba trôi qua tựa như một cái chớp mắt, thế nhưng những ký ức, tiếng cười và cả những giọt nước mắt lăn dài bên giảng đường PTNK sẽ mãi luôn khắc sâu vào tâm trí chúng ta. Từ những buổi ôn thi căng thẳng cho đến những giờ sinh hoạt lớp rộn ràng, mỗi một ngày trôi qua đều là một mảnh ghép rực rỡ cấu thành nên bức tranh thanh xuân tươi đẹp nhất.
            </p>
            <p style={{ marginBottom: '1.5rem', textIndent: '2rem' }}>
              Trang kỷ yếu này được xây dựng để lưu trữ lại hồ sơ 41 thành viên xuất sắc, những album ảnh chụp đầy ắp kỷ niệm đẹp và các lưu bút chứa đựng bao tâm sự đong đầy. Mong rằng sau này khi mở lại những trang sách in này, chúng ta sẽ mỉm cười nhớ về một thời tuổi trẻ đầy nhiệt huyết mang tên SINHLN2326.
            </p>
            <p style={{ marginTop: '3rem', textAlign: 'right', fontWeight: 600, color: '#003399' }}>
              Ban Biên Tập Kỷ Yếu Lớp
            </p>
          </div>
          <div className="print-page-number">Trang 2</div>
        </div>

        {/* ─── PAGES: MEMBERS LISTING ─── */}
        {memberPages.map((pageMembers, pageIndex) => (
          <div key={`mem-page-${pageIndex}`} className="print-page">
            <div className="print-header-deco">
              <span className="print-header-title">Thành Viên Lớp</span>
              <span className="print-header-meta">12 SINH-LN</span>
            </div>
            
            <div className="print-member-grid">
              {pageMembers.map(m => (
                <div key={m.mshs} className="print-member-card">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.full_name} className="print-member-avatar" />
                    ) : (
                      <div className="print-member-avatar" style={{ background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
                        {m.short_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="print-member-name">{m.full_name}</div>
                      <div className="print-member-mshs">MSHS: {m.mshs}</div>
                      {m.nickname && <div className="print-member-nickname">Biệt danh: {m.nickname}</div>}
                    </div>
                  </div>
                  
                  {m.quote && (
                    <div className="print-member-quote">
                      "{m.quote}"
                    </div>
                  )}
                  
                  <div className="print-member-bio">
                    {m.bio || 'Chưa có lời giới thiệu bản thân...'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="print-page-number">Trang {3 + pageIndex}</div>
          </div>
        ))}

        {/* ─── PAGES: CLASS MEMORIES ─── */}
        {photoPages.length > 0 && photoPages.map((pagePhotos, pageIndex) => (
          <div key={`photo-page-${pageIndex}`} className="print-page">
            <div className="print-header-deco">
              <span className="print-header-title">Hình Ảnh Kỷ Niệm</span>
              <span className="print-header-meta">Album Lớp</span>
            </div>

            <div className="print-gallery-grid">
              {pagePhotos.map(item => (
                <div key={item.id} className="print-gallery-card">
                  <img src={item.image_url || driveThumbnail(item.drive_file_id)} alt={item.caption} className="print-gallery-img" />
                  <div className="print-gallery-info">
                    <span className="print-gallery-caption">{item.caption || 'Kỷ niệm đẹp'}</span>
                    <span className="print-gallery-uploader">Đăng bởi: {item.uploaded_by_name || 'Thành viên'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="print-page-number">Trang {3 + memberPages.length + pageIndex}</div>
          </div>
        ))}

        {/* ─── PAGES: MESSAGES / GUESTBOOK ─── */}
        {messagePages.length > 0 && messagePages.map((pageMsgs, pageIndex) => (
          <div key={`msg-page-${pageIndex}`} className="print-page">
            <div className="print-header-deco">
              <span className="print-header-title">Góc Lưu Bút</span>
              <span className="print-header-meta">Kỷ Niệm Gửi Nhau</span>
            </div>

            <div className="print-message-grid">
              {pageMsgs.map(msg => (
                <div key={msg.id} className="print-message-card">
                  <div className="print-message-header">
                    <span>Gửi: {msg.recipient}</span>
                    <span style={{ fontWeight: 400 }}>{new Date(msg.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="print-message-content">
                    {msg.content}
                  </div>
                  <div className="print-message-footer">
                    — {msg.author}
                  </div>
                </div>
              ))}
            </div>

            <div className="print-page-number">Trang {3 + memberPages.length + photoPages.length + pageIndex}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintYearbook;
