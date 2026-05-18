"use client";
import styles from '@/app/page.module.css';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

import { useRouter } from 'next/navigation';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { role } = useAuth();
  const router = useRouter();

  const handleAdd = () => {
    if (!role) {
      router.push('/login');
      return;
    }
    addToCart(product);
  };

  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrapper}>
        <img src={product.image} alt={product.name} className={styles.productImage} />
      </div>
      <h3 className={styles.productName}>{product.name}</h3>
      <p className={styles.productDesc}>{product.desc}</p>
      <div className={styles.productFooter}>
        <span className={styles.productPrice}>{product.price}</span>
        {role !== 'seller' && role !== 'admin' && (
          <button className={styles.addBtn} onClick={handleAdd}>+</button>
        )}
      </div>
    </div>
  );
}
