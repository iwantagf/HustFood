"use client";
import Image from 'next/image';
import styles from './page.module.css';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useState } from 'react';
import { formatVndPrice } from '@/lib/pricing';

export default function CartPage() {
  const {
    cart,
    cartGroups,
    voucher,
    voucherError,
    discount,
    applyVoucher,
    clearVoucher,
    removeFromCart,
    updateItemNote,
    updateQuantity,
    totalItems,
    totalPrice,
    deliveryFee,
    finalTotal,
    isMounted
  } = useCart();
  const [voucherCode, setVoucherCode] = useState('');

  if (!isMounted) return null;

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    const applied = await applyVoucher(voucherCode);
    if (applied) setVoucherCode('');
  };

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
              {cartGroups.map(group => (
                <section key={group.merchantId} className={styles.cartGroup}>
                  <h2 className={styles.groupTitle}>{group.merchantName}</h2>
                  {group.items.map(item => (
                    <div key={item.cartKey || item.id} className={styles.cartItem}>
                      <Image
                        src={item.image || '/images/burger.png'}
                        alt={item.name}
                        width={100}
                        height={100}
                        className={styles.itemImage}
                        unoptimized
                      />
                      <div className={styles.itemDetails}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <p className={styles.itemPrice}>{formatVndPrice(item.price)}</p>
                        <div className={styles.itemOptions}>
                          {item.selectedOptions?.size && <span>{item.selectedOptions.size}</span>}
                          {item.selectedOptions?.topping && <span>{item.selectedOptions.topping}</span>}
                          {item.selectedOptions?.taste && <span>{item.selectedOptions.taste}</span>}
                        </div>
                        <input
                          className={styles.itemNote}
                          value={item.itemNote || ''}
                          onChange={e => updateItemNote(item.cartKey, e.target.value)}
                          placeholder="Ghi chú riêng cho món"
                        />
                      </div>
                      <div className={styles.itemActions}>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.cartKey, -1)}>-</button>
                        <span className={styles.itemQty}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.cartKey, 1)}>+</button>
                        <button className={styles.removeBtn} onClick={() => removeFromCart(item.cartKey)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
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
              <form onSubmit={handleApplyVoucher} className={styles.voucherForm}>
                <input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Nhập mã giảm giá" />
                <button type="submit">Áp dụng</button>
              </form>
              {voucher && (
                <div className={styles.voucherApplied}>
                  <span>{voucher.code}: -{discount.toLocaleString('vi-VN')}đ</span>
                  <button type="button" onClick={clearVoucher}>Bỏ</button>
                </div>
              )}
              {voucherError && (
                <p className={styles.voucherError}>{voucherError}</p>
              )}
              <div className={styles.summaryRow}>
                <span>Giảm giá:</span>
                <span>-{discount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--primary)' }}>{finalTotal.toLocaleString('vi-VN')}đ</span>
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
