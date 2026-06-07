"use client";
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function MenuPage() {
  const [products, setProducts] = useState([]);

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
      </div>
    </>
  );
}
