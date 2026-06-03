"use client";
import styles from './page.module.css';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const { cart, cartGroups, voucher, discount, totalItems, totalPrice, deliveryFee, finalTotal, isMounted } = useCart();
  const { role, isLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'cod'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!isLoading && role !== 'customer') {
      router.replace(`/login?next=/checkout`);
    }
  }, [isLoading, role, router]);

  if (!isMounted || isLoading || role !== 'customer') return null;

  if (cart.length === 0) {
    router.push('/cart');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePhone = (phone) => {
    const regex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    return regex.test(phone.replace(/\s+/g, ''));
  };

  const processOrder = async () => {
    setIsProcessing(true);
    try {
      const orderData = {
        customer: formData,
        items: cart,
        totalItems,
        totalPrice,
        deliveryFee,
        finalTotal,
        voucherCode: voucher?.code || ''
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        router.push('/success');
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi xảy ra khi đặt hàng');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi đặt hàng');
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) {
      alert("Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam hợp lệ (VD: 0987654321).");
      return;
    }

    if (formData.paymentMethod === 'momo' || formData.paymentMethod === 'card') {
      setShowQR(true);
    } else {
      processOrder();
    }
  };

  return (
    <main>
      <Header />
      <div className={`container ${styles.checkoutContainer}`}>
        <h1 className={styles.checkoutTitle}>Thanh Toán</h1>

        {/* Modal QR Code */}
        {showQR && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Thanh toán qua {formData.paymentMethod === 'momo' ? 'MoMo' : 'Ngân hàng'}</h3>
              <p>Quét mã QR dưới đây để thanh toán số tiền: <strong>{finalTotal.toLocaleString('vi-VN')}đ</strong></p>
              <div className={styles.qrPlaceholder}>
                <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>Đang chờ thanh toán...</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowQR(false)}>Hủy</button>
                <button type="button" className="btn btn-primary" onClick={() => { setShowQR(false); processOrder(); }}>
                  {isProcessing ? 'Đang xử lý...' : 'Đã Thanh Toán Xong'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.checkoutLayout}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Thông tin giao hàng</h2>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Họ và Tên</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className={styles.formInput} placeholder="Nhập họ tên người nhận" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Số Điện Thoại</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className={styles.formInput} placeholder="Nhập số điện thoại (VD: 0987...)" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Địa chỉ giao hàng</label>
              <input required type="text" name="address" value={formData.address} onChange={handleChange} className={styles.formInput} placeholder="Nhập địa chỉ nhận hàng" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className={styles.formTextarea} placeholder="VD: Giao giờ hành chính, nhiều tương ớt..." />
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: '3rem' }}>Phương thức thanh toán</h2>
            <div className={styles.paymentMethods}>
              <label className={styles.paymentOption}>
                <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} />
                <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
              </label>
              <label className={styles.paymentOption}>
                <input type="radio" name="paymentMethod" value="momo" checked={formData.paymentMethod === 'momo'} onChange={handleChange} />
                <span>Thanh toán qua ví MoMo</span>
              </label>
              <label className={styles.paymentOption}>
                <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleChange} />
                <span>Thanh toán qua Thẻ tín dụng/Ghi nợ</span>
              </label>
            </div>
          </div>

          <div className={styles.orderSummary}>
            <h2 className={styles.sectionTitle}>Đơn hàng của bạn</h2>

            {cartGroups.map(group => (
              <div key={group.merchantId} className={styles.summaryGroup}>
                <h3>{group.merchantName}</h3>
                {group.items.map(item => (
                  <div key={item.cartKey || item.id} className={styles.summaryItem}>
                    <span className={styles.summaryItemQty}>{item.quantity}x</span>
                    <span className={styles.summaryItemName}>
                      {item.name}
                      {(item.selectedOptions?.size || item.selectedOptions?.topping || item.selectedOptions?.taste) && (
                        <small>
                          {[item.selectedOptions?.size, item.selectedOptions?.topping, item.selectedOptions?.taste].filter(Boolean).join(' · ')}
                        </small>
                      )}
                      {item.itemNote && <small>Ghi chú: {item.itemNote}</small>}
                    </span>
                    <span>{item.price}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className={styles.divider}></div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryItemName}>Tạm tính</span>
              <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemName}>Phí giao hàng</span>
              <span>{deliveryFee.toLocaleString('vi-VN')}đ</span>
            </div>
            {voucher && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryItemName}>Mã {voucher.code}</span>
                <span>-{discount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}

            <div className={styles.divider}></div>

            <div className={styles.summaryTotal}>
              <span>Tổng cộng</span>
              <span>{finalTotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <button type="submit" disabled={isProcessing} className={`btn btn-primary ${styles.submitBtn}`}>
              {isProcessing ? 'Đang xử lý...' : 'Xác Nhận Đặt Hàng'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
