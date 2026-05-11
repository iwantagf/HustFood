"use client";
import styles from '@/app/page.module.css';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrapper}>
        <img src={product.image} alt={product.name} className={styles.productImage} />
      </div>
      <h3 className={styles.productName}>{product.name}</h3>
      <p className={styles.productDesc}>{product.desc}</p>
      <div className={styles.productFooter}>
        <span className={styles.productPrice}>{product.price}</span>
        <button className={styles.addBtn} onClick={() => addToCart(product)}>+</button>
      </div>
    </div>
  );
}
