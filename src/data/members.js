// Danh sách thành viên — Fallback local khi Supabase chưa sẵn sàng
// Dữ liệu chính thức nằm trên Supabase bảng `members`

const avatarColors = [
  '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#14b8a6', '#f97316', '#d946ef',
  '#0ea5e9', '#a855f7', '#84cc16', '#e11d48', '#0891b2',
  '#7c3aed', '#059669', '#dc2626', '#2563eb', '#c026d3',
  '#16a34a', '#ea580c', '#4f46e5', '#db2777', '#0d9488',
  '#9333ea', '#65a30d', '#be123c', '#0284c7', '#a21caf',
  '#15803d', '#c2410c', '#4338ca', '#be185d', '#0f766e',
  '#7e22ce', '#4d7c0f', '#9f1239', '#0369a1', '#86198f',
  '#166534',
];

// Fallback data — chỉ dùng khi chưa kết nối Supabase
export const localMembers = [
  { id: 1,  mshs: '232401', full_name: 'Nguyễn Đoàn Minh An',       short_name: 'An',      color: avatarColors[0],  role: 'member' },
  { id: 2,  mshs: '232402', full_name: 'Mạc Thái Trâm Anh',         short_name: 'Anh',     color: avatarColors[1],  role: 'member' },
  { id: 3,  mshs: '232403', full_name: 'Nguyễn Hoàng Phương Anh',    short_name: 'Anh',     color: avatarColors[2],  role: 'member' },
  { id: 4,  mshs: '232404', full_name: 'Nguyễn Ngọc Đông Anh',       short_name: 'Anh',     color: avatarColors[3],  role: 'member' },
  { id: 5,  mshs: '232405', full_name: 'Nguyễn Ngọc Quỳnh Anh',      short_name: 'Anh',     color: avatarColors[4],  role: 'member' },
  { id: 6,  mshs: '232406', full_name: 'Võ Phúc Phương Anh',          short_name: 'Anh',     color: avatarColors[5],  role: 'member' },
  { id: 7,  mshs: '232407', full_name: 'Trần Gia Bảo',               short_name: 'Bảo',     color: avatarColors[6],  role: 'member' },
  { id: 8,  mshs: '232408', full_name: 'Nguyễn Bá Phương Bắc',       short_name: 'Bắc',     color: avatarColors[7],  role: 'member' },
  { id: 9,  mshs: '232409', full_name: 'Nguyễn Văn Việt Bình',        short_name: 'Bình',    color: avatarColors[8],  role: 'member' },
  { id: 10, mshs: '232410', full_name: 'Trần Ngọc Dân',              short_name: 'Dân',     color: avatarColors[9],  role: 'member' },
  { id: 11, mshs: '232411', full_name: 'Nguyễn Thùy Dung',           short_name: 'Dung',    color: avatarColors[10], role: 'member' },
  { id: 12, mshs: '232412', full_name: 'Vũ Nguyễn Hải Đăng',         short_name: 'Đăng',    color: avatarColors[11], role: 'member' },
  { id: 13, mshs: '232413', full_name: 'Phan Hữu Minh Đức',          short_name: 'Đức',     color: avatarColors[12], role: 'member' },
  { id: 14, mshs: '232414', full_name: 'Đỗ Mai Hân',                 short_name: 'Hân',     color: avatarColors[13], role: 'member' },
  { id: 15, mshs: '232415', full_name: 'Hồ Trần Ngọc Hân',           short_name: 'Hân',     color: avatarColors[14], role: 'member' },
  { id: 16, mshs: '232416', full_name: 'Nguyễn Ngọc Bích Hân',       short_name: 'Hân',     color: avatarColors[15], role: 'member' },
  { id: 17, mshs: '232418', full_name: 'Ngô Gia Huy',                short_name: 'Huy',     color: avatarColors[16], role: 'member' },
  { id: 18, mshs: '232420', full_name: 'Bạch Hưng Khôi',             short_name: 'Khôi',    color: avatarColors[17], role: 'member' },
  { id: 19, mshs: '232421', full_name: 'Nguyễn Đình Khuê',           short_name: 'Khuê',    color: avatarColors[18], role: 'member' },
  { id: 20, mshs: '232422', full_name: 'Phan Vũ Phúc Lân',           short_name: 'Lân',     color: avatarColors[19], role: 'member' },
  { id: 21, mshs: '232423', full_name: 'Hà Trần Nhật Linh',           short_name: 'Linh',    color: avatarColors[20], role: 'member' },
  { id: 22, mshs: '232424', full_name: 'Nguyễn Phương Linh',          short_name: 'Linh',    color: avatarColors[21], role: 'member' },
  { id: 23, mshs: '232425', full_name: 'Nguyễn Ngọc Phương Loan',     short_name: 'Loan',    color: avatarColors[22], role: 'member' },
  { id: 24, mshs: '232426', full_name: 'Cao Tiến Minh',              short_name: 'Minh',    color: avatarColors[23], role: 'member' },
  { id: 25, mshs: '232430', full_name: 'Nguyễn Bảo Nguyên',          short_name: 'Nguyên',  color: avatarColors[24], role: 'member' },
  { id: 26, mshs: '232432', full_name: 'Nguyễn Chí Nhân',            short_name: 'Nhân',    color: avatarColors[25], role: 'member' },
  { id: 27, mshs: '232433', full_name: 'Nguyễn Vũ Trọng Nhân',       short_name: 'Nhân',    color: avatarColors[26], role: 'admin' },
  { id: 28, mshs: '232434', full_name: 'Nguyễn Võ Khánh Nhi',         short_name: 'Nhi',     color: avatarColors[27], role: 'member' },
  { id: 29, mshs: '232435', full_name: 'Nguyễn Trần Hà Phương',       short_name: 'Phương',  color: avatarColors[28], role: 'member' },
  { id: 30, mshs: '232436', full_name: 'Võ Việt Anh Thư',             short_name: 'Thư',     color: avatarColors[29], role: 'member' },
  { id: 31, mshs: '232437', full_name: 'Nguyễn Phúc Toàn',           short_name: 'Toàn',    color: avatarColors[30], role: 'member' },
  { id: 32, mshs: '232438', full_name: 'Nguyễn Hứa Anh Trang',       short_name: 'Trang',   color: avatarColors[31], role: 'member' },
  { id: 33, mshs: '232439', full_name: 'Phan Thúy Mai Trang',         short_name: 'Trang',   color: avatarColors[32], role: 'member' },
  { id: 34, mshs: '232440', full_name: 'Nguyễn Lê Uyên Trân',         short_name: 'Trân',    color: avatarColors[33], role: 'member' },
  { id: 35, mshs: '232441', full_name: 'Trương Quang Minh Trí',       short_name: 'Trí',     color: avatarColors[34], role: 'member' },
  { id: 36, mshs: '232442', full_name: 'Đặng Huỳnh Đông Trúc',       short_name: 'Trúc',    color: avatarColors[35], role: 'member' },
  { id: 37, mshs: '232443', full_name: 'Nguyễn Ngọc Bảo Trúc',       short_name: 'Trúc',    color: avatarColors[36], role: 'member' },
  { id: 38, mshs: '232444', full_name: 'Hồ Ngọc Bảo Uyên',           short_name: 'Uyên',    color: avatarColors[37], role: 'member' },
  { id: 39, mshs: '232445', full_name: 'Lê Phương Uyên',              short_name: 'Uyên',    color: avatarColors[38], role: 'member' },
  { id: 40, mshs: '232447', full_name: 'Phan Hải Uyên',               short_name: 'Uyên',    color: avatarColors[39], role: 'member' },
  { id: 41, mshs: '232448', full_name: 'Lê Thúy Vương',              short_name: 'Vương',   color: avatarColors[40], role: 'member' },
];

// MSHS hợp lệ
export const validMshsList = localMembers.map(m => m.mshs);

// ADMIN MSHS
export const ADMIN_MSHS = '232433';

// Helper: lấy MSHS từ email
export function extractMshs(email) {
  return email?.split('@')[0]?.replace('student', '') || '';
}
