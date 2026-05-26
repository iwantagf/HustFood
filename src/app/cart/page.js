"use client";
import styles from './page.module.css';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice, deliveryFee, isMounted } = useCart();

  if (!isMounted) return null;

  return (
    <main>
      <Header />
      <div className={`container ${styles.cartContainer}`}>
        <h1 className={styles.cartTitle}>Giỏ Hàng Của Bạn</h1>
        
        {cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Giỏ hàng đang trống.</p>
            <br />
            <Link href="/" className="btn btn-primary">Khám Phá Thực Đơn</Link>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {cart.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <img src={item.image} alt={item.name} className={styles.itemImage} />
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>{item.price}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span className={styles.itemQty}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>+</button>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.cartSummary}>
              <h2 className={styles.summaryTitle}>Tóm Tắt Đơn Hàng</h2>
              <div className={styles.summaryRow}>
                <span>Số lượng món:</span>
                <span>{totalItems}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tạm tính:</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Phí giao hàng:</span>
                <span>{deliveryFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--primary)' }}>{(totalPrice + deliveryFee).toLocaleString('vi-VN')}đ</span>
              </div>
              <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`} style={{ display: 'block', textAlign: 'center' }}>
                Tiến Hành Thanh Toán
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
