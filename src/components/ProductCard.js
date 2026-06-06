"use client";
import { useState } from 'react';
import styles from '@/app/page.module.css';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

import { useRouter } from 'next/navigation';

function shortenReviewText(value) {
  const text = String(value || '').trim();
  if (text.length <= 90) return text;
  return `${text.slice(0, 87)}...`;
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { role } = useAuth();
  const router = useRouter();
  const canOrder = !role || role === 'customer';
  const reviewStats = product.reviewStats || null;
  const reviewCount = Number(reviewStats?.count || 0);
  const latestReview = Array.isArray(product.recentReviews)
    ? product.recentReviews.find((review) => review.comment)
    : null;
  const [selection, setSelection] = useState({
    size: product.options?.sizes?.[0] || '',
    topping: product.options?.toppings?.[0] || '',
    taste: product.options?.tastes?.[0] || '',
    note: ''
  });

  const handleSelectionChange = (field, value) => {
    setSelection(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!role) {
      router.push('/login');
      return;
    }
    addToCart(product, selection);
  };

  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrapper}>
        <img src={product.image} alt={product.name} className={styles.productImage} />
      </div>
      <h3 className={styles.productName}>{product.name}</h3>
      {reviewCount > 0 && (
        <div className={styles.productReviewMeta}>
          <span>{Number(reviewStats.averageFoodRating || 0).toFixed(1)} sao</span>
          <span>{reviewCount.toLocaleString('vi-VN')} đánh giá</span>
        </div>
      )}
      <p className={styles.productDesc}>{product.desc}</p>
      {latestReview?.comment && (
        <p className={styles.productReviewSnippet}>
          &quot;{shortenReviewText(latestReview.comment)}&quot;
        </p>
      )}
      {canOrder && (
        <div className={styles.optionControls}>
          {product.options?.sizes?.length > 0 && (
            <select value={selection.size} onChange={e => handleSelectionChange('size', e.target.value)} aria-label="Chọn kích cỡ">
              {product.options.sizes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
          {product.options?.toppings?.length > 0 && (
            <select value={selection.topping} onChange={e => handleSelectionChange('topping', e.target.value)} aria-label="Chọn topping">
              {product.options.toppings.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
          {product.options?.tastes?.length > 0 && (
            <select value={selection.taste} onChange={e => handleSelectionChange('taste', e.target.value)} aria-label="Chọn vị">
              {product.options.tastes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
          {product.options?.allowNote !== false && (
            <input value={selection.note} onChange={e => handleSelectionChange('note', e.target.value)} placeholder="Ghi chú món" aria-label="Ghi chú món" />
          )}
        </div>
      )}
      <div className={styles.productFooter}>
        <span className={styles.productPrice}>{product.price}</span>
        {canOrder && (
          <button className={styles.addBtn} onClick={handleAdd}>+</button>
        )}
      </div>
    </div>
  );
}
