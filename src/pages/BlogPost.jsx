import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import API_URL from '../config';

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/blog/${id}`)
      .then(r => r.json())
      .then(data => { setPost(data.post); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="container"><p>Loading...</p></div></div>;
  if (!post) return <div className="page"><div className="container"><p>Post not found. <Link to="/blog">Back to blog</Link></p></div></div>;

  return (
    <div className="page blog-post-page">
      <div className="container">
        <Link to="/blog" className="btn btn-sm">&larr; Back to Blog</Link>
        <article className="blog-post-content">
          <h1>{post.title}</h1>
          <p className="blog-meta">By {post.author || 'Admin'} &middot; {new Date(post.createdAt).toLocaleDateString()}</p>
          {post.image && <img src={`${API_URL}${post.image}`} alt={post.title} className="blog-hero" loading="lazy" />}
          <div className="blog-body" dangerouslySetInnerHTML={{ __html: post.content }} />
          {post.tags && post.tags.length > 0 && (
            <div className="blog-tags">
              {post.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}