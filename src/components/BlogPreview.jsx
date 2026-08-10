import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function BlogPreview() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/blog`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="section blog-preview-section">
      <div className="container">
        <div className="section-header section-header-row">
          <div>
            <h2>{t('home.blog.title')}</h2>
            <p>{t('home.blog.subtitle')}</p>
          </div>
          <div className="section-header-actions">
            <Link to="/blog" className="btn-ghost btn-sm">{t('home.blog.viewAll')}</Link>
          </div>
        </div>
        <div className="blog-preview-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="blog-preview-card skeleton-card">
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-lg" />
                    <div className="skeleton-line skeleton-sm" />
                  </div>
                </div>
              ))
            : posts.slice(0, 3).map((post) => (
                <Link to={`/blog/${post.id}`} key={post.id} className="blog-preview-card">
                  {post.image && (
                    <div className="blog-preview-img">
                      <img src={`${API_URL}${post.image}`} alt={post.title} loading="lazy" />
                    </div>
                  )}
                  <div className="blog-preview-body">
                    <p className="blog-preview-meta">By {post.author || 'Dream Homes'} · {new Date(post.createdAt).toLocaleDateString()}</p>
                    <h3>{post.title}</h3>
                    <p className="blog-preview-excerpt">{post.excerpt || post.content?.substring(0, 140)}</p>
                    <span className="blog-preview-cta">{t('home.blog.readMore')} →</span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
