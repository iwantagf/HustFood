"use client";
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function MenuPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', desc: '', price: '', image: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchProducts, 0);
    return () => clearTimeout(initialFetch);
  }, []);

  const handleDelete = async (id) => {
    if(!confirm('Bạn có chắc chắn muốn xóa món này?')) return;
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchProducts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let imageUrl = formData.image || '/images/burger.png';
    
    if (file) {
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          imageUrl = uploadResult.url;
        }
      } catch (err) {
        console.error('Lỗi upload ảnh:', err);
      }
    }

    const newProduct = { ...formData, image: imageUrl };

    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    
    setFormData({ name: '', desc: '', price: '', image: '' });
    setFile(null);
    document.getElementById('file-upload').value = '';
    setUploading(false);
    fetchProducts();
  };

  return (
    <>
      <h1 className={styles.pageTitle}>Quản lý Thực Đơn</h1>
      
      <div className={styles.menuLayout}>
        <div className={styles.tableContainer} style={{ flex: 2 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tên món & Mô tả</th>
                <th>Giá</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <img src={p.image} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.desc}</p>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.price}</td>
                  <td>
                    <button onClick={() => handleDelete(p.id)} className={styles.actionBtn} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableContainer} style={{ flex: 1, padding: '2rem' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Thêm Món Mới</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tên món</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Giá tiền (VD: 50.000đ)</label>
              <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Mô tả ngắn</label>
              <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '80px' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Hình ảnh (Tải lên)</label>
              <input id="file-upload" type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px dashed var(--primary)', background: 'var(--primary-light)' }} />
            </div>
            <button type="submit" disabled={uploading} className={styles.actionBtn} style={{ width: '100%', padding: '1rem' }}>
              {uploading ? 'Đang tải lên...' : 'Thêm Món'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
