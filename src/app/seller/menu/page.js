"use client";
import { useState, useEffect } from 'react';
import styles from '../../admin/admin.module.css';
import Link from 'next/link';

const DEFAULT_MENU_FORM = {
  name: '',
  desc: '',
  price: '',
  image: '',
  categoryId: '',
  sizes: '',
  toppings: '',
  tastes: '',
  allowNote: true,
  isAvailable: true,
  isHidden: false
};

function optionArrayToText(value) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function productToMenuForm(product) {
  return {
    name: product.name || '',
    desc: product.desc || '',
    price: product.price ? product.price.replace('đ', '') : '',
    image: product.image || '',
    categoryId: product.categoryId || '',
    sizes: optionArrayToText(product.options?.sizes),
    toppings: optionArrayToText(product.options?.toppings),
    tastes: optionArrayToText(product.options?.tastes),
    allowNote: product.options?.allowNote !== false,
    isAvailable: product.isAvailable !== false,
    isHidden: Boolean(product.isHidden)
  };
}

function menuFormToPayload(menuForm, imageUrl) {
  return {
    name: menuForm.name,
    desc: menuForm.desc,
    price: menuForm.price ? (menuForm.price.endsWith('đ') ? menuForm.price : `${menuForm.price}đ`) : '',
    image: imageUrl,
    categoryId: menuForm.categoryId || null,
    options: {
      sizes: menuForm.sizes,
      toppings: menuForm.toppings,
      tastes: menuForm.tastes,
      allowNote: menuForm.allowNote
    },
    isAvailable: menuForm.isAvailable,
    isHidden: menuForm.isHidden
  };
}

export default function SellerMenuPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  const [menuForm, setMenuForm] = useState(DEFAULT_MENU_FORM);
  const [categoryForm, setCategoryForm] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('product'); // 'product' | 'category'

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        fetch('/api/products?scope=mine'),
        fetch('/api/menu-categories?scope=mine'),
        fetch('/api/orders')
      ]);
      const [productsData, categoriesData, ordersData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        ordersRes.json()
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Không tải được dữ liệu thực đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const productSales = orders.reduce((acc, order) => {
    order.items?.forEach(item => {
      if (!acc[item.id]) {
        acc[item.id] = { ...item, sold: 0 };
      }
      acc[item.id].sold += item.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  const handleMenuProductChange = (field, value) => {
    if (field === 'price') {
      const numericValue = value.replace(/\D/g, '');
      const formattedValue = numericValue ? numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
      setMenuForm(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setMenuForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetMenuForm = () => {
    setMenuForm(DEFAULT_MENU_FORM);
    setEditingProductId(null);
    setMenuImageFile(null);
    const fileInput = document.getElementById('seller-menu-file');
    if (fileInput) fileInput.value = '';
  };

  const openFormModal = (tab = 'product') => {
    resetMenuForm();
    setActiveTab(tab);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    resetMenuForm();
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/menu-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không tạo được danh mục.');
        return;
      }

      setCategories(prev => [...prev, data]);
      setMenuForm(prev => ({ ...prev, categoryId: data.id }));
      setCategoryForm('');
      alert('Tạo danh mục thành công!');
      setActiveTab('product'); // Switch back to product form
    } catch (error) {
      console.error('Không tạo được danh mục:', error);
      alert('Có lỗi xảy ra khi tạo danh mục.');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setMenuForm(productToMenuForm(product));
    setMenuImageFile(null);
    setActiveTab('product');
    setIsFormOpen(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);

    try {
      let imageUrl = menuForm.image || '/images/burger.png';

      if (menuImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', menuImageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();

        if (!uploadRes.ok || !uploadResult.success) {
          alert(uploadResult.error || 'Không tải được ảnh món.');
          return;
        }

        imageUrl = uploadResult.url;
      }

      const payload = menuFormToPayload(menuForm, imageUrl);
      const res = await fetch('/api/products', {
        method: editingProductId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProductId ? { id: editingProductId, ...payload } : payload)
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không lưu được món trong thực đơn.');
        return;
      }

      setProducts(prev => editingProductId
        ? prev.map(product => product.id === editingProductId ? data : product)
        : [data, ...prev]);
      
      alert(editingProductId ? 'Sửa món thành công' : 'Thêm món thành công');
      closeFormModal();
    } catch (error) {
      console.error('Không lưu được món:', error);
      alert('Có lỗi xảy ra khi lưu món.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const updateProductInline = async (product, patch) => {
    try {
      const payload = {
        ...productToMenuForm(product),
        ...patch
      };
      const imageUrl = payload.image || product.image || '/images/burger.png';
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, ...menuFormToPayload(payload, imageUrl) })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không cập nhật được món.');
        return;
      }

      setProducts(prev => prev.map(item => item.id === product.id ? data : item));
    } catch (error) {
      console.error('Không cập nhật được món:', error);
      alert('Có lỗi xảy ra khi cập nhật món.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn cửa hàng?')) return;

    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không xóa được món khỏi thực đơn.');
        return;
      }

      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (error) {
      console.error('Không xóa được món:', error);
      alert('Có lỗi xảy ra khi xóa món.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải dữ liệu thực đơn...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Thực Đơn Của Tôi</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Quản lý danh sách món ăn và trạng thái còn hàng.
      </p>

      {/* Product List Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1.5rem',
        alignItems: 'stretch'
      }}>
        
        {/* ADD NEW PRODUCT CARD */}
        <div 
          onClick={() => openFormModal('product')}
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            border: '2px dashed #ccc', 
            borderRadius: '16px', 
            background: '#fafafa', 
            cursor: 'pointer',
            padding: '3rem 2rem',
            transition: 'all 0.2s ease',
            minHeight: '220px'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.background = '#fafafa'; }}
        >
          <div style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '0.5rem', lineHeight: 1 }}>+</div>
          <div style={{ fontWeight: '600', color: 'var(--text)' }}>Thêm sản phẩm mới</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Hoặc thêm danh mục</div>
        </div>

        {/* PRODUCT CARDS */}
        {products.map((product) => (
          <div key={product.id} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem', 
            border: '1px solid #eee', 
            borderRadius: '16px', 
            background: product.isHidden ? '#f9fafb' : '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
              <img src={product.image || '/images/burger.png'} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'start' }}>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                  <span className={`${styles.statusBadge} ${product.isAvailable === false ? styles.statusRejected : styles.statusCompleted}`} style={{ whiteSpace: 'nowrap', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    {product.isAvailable === false ? 'Hết hàng' : 'Còn hàng'}
                  </span>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1rem', marginTop: '0.2rem' }}>{product.price}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {product.category?.name || 'Chưa phân loại'}{product.isHidden ? ' · Đang ẩn' : ''}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.desc}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
              <button type="button" onClick={() => handleEditProduct(product)} className={styles.actionBtn} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>
                Sửa món
              </button>
              <button type="button" onClick={() => updateProductInline(product, { isAvailable: product.isAvailable === false })} className={styles.actionBtn} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.5rem', fontSize: '0.85rem' }}>
                {product.isAvailable === false ? 'Bật còn hàng' : 'Hết hàng'}
              </button>
              <button type="button" onClick={() => updateProductInline(product, { isHidden: !product.isHidden })} className={styles.actionBtn} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.5rem', fontSize: '0.85rem' }}>
                {product.isHidden ? 'Đang ẩn' : 'Ẩn món'}
              </button>
              <button type="button" onClick={() => handleDeleteProduct(product.id)} className={styles.actionBtn} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.5rem', fontSize: '0.85rem' }}>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TOP PRODUCTS SECTION */}
      {topProducts.length > 0 && (
        <div className={styles.tableContainer} style={{ padding: '1.5rem', marginTop: '3rem' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Sản phẩm bán chạy nhất</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {topProducts.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f9fafb', padding: '1rem', borderRadius: '12px' }}>
                <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }} />
                <div>
                  <div style={{ fontWeight: '700' }}>{item.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đã bán: {item.sold} phần</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL FOR ADD/EDIT */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingProductId ? 'Sửa món ăn' : 'Quản lý Thực Đơn'}
              </h2>
              <button onClick={closeFormModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>

            {/* Modal Tabs (only show if not editing) */}
            {!editingProductId && (
              <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 1.5rem', background: '#fafafa' }}>
                <button 
                  onClick={() => setActiveTab('product')}
                  style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'product' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'product' ? 'var(--primary)' : '#666', fontWeight: activeTab === 'product' ? '600' : '400', marginRight: '1.5rem', cursor: 'pointer' }}
                >
                  Thêm Món Mới
                </button>
                <button 
                  onClick={() => setActiveTab('category')}
                  style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'category' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'category' ? 'var(--primary)' : '#666', fontWeight: activeTab === 'category' ? '600' : '400', cursor: 'pointer' }}
                >
                  Thêm Danh Mục
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              
              {/* PRODUCT FORM */}
              {activeTab === 'product' && (
                <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Tên món</label>
                      <input required type="text" value={menuForm.name} onChange={e => handleMenuProductChange('name', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Mô tả</label>
                      <textarea required value={menuForm.desc} onChange={e => handleMenuProductChange('desc', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', minHeight: '74px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Giá (VD: 65000)</label>
                      <input required type="text" value={menuForm.price} onChange={e => handleMenuProductChange('price', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Danh mục</label>
                      <select value={menuForm.categoryId} onChange={e => handleMenuProductChange('categoryId', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
                        <option value="">Chưa phân loại</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Ảnh món</label>
                    <input id="seller-menu-file" type="file" accept="image/*" onChange={e => setMenuImageFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px dashed var(--primary)', background: 'var(--primary-light)' }} />
                    <input type="text" value={menuForm.image} onChange={e => handleMenuProductChange('image', e.target.value)} placeholder="/images/burger.png" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Kích cỡ</label>
                      <input type="text" value={menuForm.sizes} onChange={e => handleMenuProductChange('sizes', e.target.value)} placeholder="Nhỏ, Vừa..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Topping</label>
                      <input type="text" value={menuForm.toppings} onChange={e => handleMenuProductChange('toppings', e.target.value)} placeholder="Phô mai..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Vị/cấp độ</label>
                      <input type="text" value={menuForm.tastes} onChange={e => handleMenuProductChange('tastes', e.target.value)} placeholder="Không cay..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', fontWeight: '600' }}>
                      <input type="checkbox" checked={menuForm.allowNote} onChange={e => handleMenuProductChange('allowNote', e.target.checked)} />
                      Cho khách ghi chú riêng
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', fontWeight: '600' }}>
                      <input type="checkbox" checked={menuForm.isAvailable} onChange={e => handleMenuProductChange('isAvailable', e.target.checked)} />
                      Đang còn hàng
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', fontWeight: '600' }}>
                      <input type="checkbox" checked={menuForm.isHidden} onChange={e => handleMenuProductChange('isHidden', e.target.checked)} />
                      Ẩn khỏi thực đơn khách hàng
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={closeFormModal} className={styles.actionBtn} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.8rem' }}>
                      Hủy
                    </button>
                    <button type="submit" disabled={isSavingProduct} className={styles.actionBtn} style={{ flex: 2, padding: '0.8rem', opacity: isSavingProduct ? 0.7 : 1 }}>
                      {isSavingProduct ? 'Đang lưu...' : editingProductId ? 'Lưu chỉnh sửa' : 'Tạo món mới'}
                    </button>
                  </div>
                </form>
              )}

              {/* CATEGORY FORM */}
              {activeTab === 'category' && (
                <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Phân loại các món ăn của bạn thành các danh mục để khách hàng dễ dàng tìm kiếm (VD: Món chính, Đồ uống, Tráng miệng).</p>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Tên danh mục mới</label>
                    <input required type="text" value={categoryForm} onChange={e => setCategoryForm(e.target.value)} placeholder="Nhập tên danh mục..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={closeFormModal} className={styles.actionBtn} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.8rem' }}>
                      Hủy
                    </button>
                    <button type="submit" disabled={!categoryForm.trim()} className={styles.actionBtn} style={{ flex: 2, padding: '0.8rem', opacity: categoryForm.trim() ? 1 : 0.6 }}>
                      Tạo Danh Mục
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
