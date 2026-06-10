"use client";
import Image from 'next/image';
import { useState } from 'react';
import styles from '@/app/page.module.css';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_PRODUCT_IMAGE, normalizeImageSource } from '@/lib/imageSources';
import { formatVndPrice } from '@/lib/pricing';

import { useRouter } from 'next/navigation';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { role } = useAuth();
  const router = useRouter();
  const canOrder = !role || role === 'customer';
  const soldCount = Number(product.soldCount || 0);
  const [imageSrc, setImageSrc] = useState(() => normalizeImageSource(product.image));
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
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className={styles.productImage}
          unoptimized
          onError={() => setImageSrc(DEFAULT_PRODUCT_IMAGE)}
        />
      </div>
      <h3 className={styles.productName}>{product.name}</h3>
      {soldCount > 0 && (
        <div className={styles.productSoldMeta}>
          <span>Đã bán {soldCount.toLocaleString('vi-VN')}</span>
        </div>
      )}
      <p className={styles.productDesc}>{product.desc}</p>
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
        <span className={styles.productPrice}>{formatVndPrice(product.price)}</span>
        {canOrder && (
          <button className={styles.addBtn} onClick={handleAdd}>+</button>
        )}
      </div>
    </div>
  );
}
