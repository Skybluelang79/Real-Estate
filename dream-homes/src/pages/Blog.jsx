import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';

export default function Blog() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/blog`)
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {});
  }, []);

  return (
    <div className="page blog-page">
      <div className="page-header">
        <div className="container">
          <h1>Blog & News</h1>
          <p>Latest updates from Dream Homes</p>
        </div>
      </div>
      <div className="container">
        {posts.length === 0 ? (
          <p className="empty-state">No blog posts yet.</p>
        ) : (
          <div className="blog-grid">
            {posts.map(post => (
              <article key={post.id} className="blog-card card">
                {post.image && <img src={`${API_URL}${post.image}`} alt={post.title} className="blog-image" />}
                <div className="blog-body">
                  <h2><Link to={`/blog/${post.id}`}>{post.title}</Link></h2>
                  <p className="blog-meta">By {post.author || 'Admin'} &middot; {new Date(post.createdAt).toLocaleDateString()}</p>
                  <p className="blog-excerpt">{post.excerpt || post.content?.substring(0, 200)}</p>
                  <Link to={`/blog/${post.id}`} className="btn btn-sm">Read More</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}