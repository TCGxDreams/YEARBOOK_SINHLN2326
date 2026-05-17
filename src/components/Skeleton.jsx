import './Skeleton.css';

/**
 * Primitive skeleton block. Dùng cho any element cần loading state.
 */
export const Skeleton = ({ width, height, radius = '8px', className = '', style = {} }) => (
    <div
        className={`skeleton ${className}`}
        style={{ width, height, borderRadius: radius, ...style }}
    />
);

/**
 * Skeleton grid cho Gallery: dùng cùng `.gallery-masonry` + `.gallery-item` để layout khớp 100%
 */
export const GallerySkeleton = ({ count = 9 }) => (
    <div className="gallery-masonry">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="gallery-item skeleton-gallery-item">
                <div className="skeleton skeleton-img" />
            </div>
        ))}
    </div>
);

/**
 * Skeleton cards cho Members page
 */
export const MembersSkeleton = ({ count = 12 }) => (
    <div className="members-grid">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="member-card premium-member-card skeleton-member-card">
                <div className="skeleton-member-header" />
                <div className="skeleton skeleton-avatar" />
                <div className="member-info">
                    <div className="skeleton skeleton-text skeleton-name" />
                    <div className="skeleton skeleton-text skeleton-badge" />
                    <div className="skeleton skeleton-text skeleton-quote" />
                    <div className="skeleton skeleton-text skeleton-quote short" />
                </div>
                <div className="skeleton-member-footer" />
            </div>
        ))}
    </div>
);

/**
 * Skeleton notes cho Messages page
 */
export const MessagesSkeleton = ({ count = 6 }) => (
    <div className="messages-board">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="message-note skeleton-message">
                <div className="skeleton skeleton-text skeleton-msg-author" />
                <div className="skeleton skeleton-text skeleton-msg-line" />
                <div className="skeleton skeleton-text skeleton-msg-line" />
                <div className="skeleton skeleton-text skeleton-msg-line short" />
            </div>
        ))}
    </div>
);

export default Skeleton;