"use client";
import { createContext, useState, useContext, useEffect, useMemo, useRef } from 'react';
import { DEMO_DELIVERY_FEE, calculateFinalTotal, calculateItemsSubtotal, calculateVoucherDiscount } from '@/lib/pricing';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext();

function normalizeSelection(selection = {}) {
  return {
    size: String(selection.size || '').trim(),
    topping: String(selection.topping || '').trim(),
    taste: String(selection.taste || '').trim(),
    note: String(selection.note || '').trim()
  };
}

function createCartKey(productId, selection = {}) {
  const normalizedSelection = normalizeSelection(selection);
  return `${productId}:${JSON.stringify(normalizedSelection)}`;
}

function getMerchantInfo(product) {
  const profile = product?.owner?.merchantProfile;

  return {
    merchantId: profile?.ownerId || product?.ownerId || product?.owner?.id || 'shared-menu',
    merchantName: profile?.shopName || 'HustFood'
  };
}

function groupCartItems(items = []) {
  const groupByMerchant = new Map();

  for (const item of items) {
    const merchantId = item.merchantId || 'shared-menu';
    if (!groupByMerchant.has(merchantId)) {
      groupByMerchant.set(merchantId, {
        merchantId,
        merchantName: item.merchantName || 'HustFood',
        items: []
      });
    }
    groupByMerchant.get(merchantId).items.push(item);
  }

  return Array.from(groupByMerchant.values());
}

export function CartProvider({ children }) {
  const { user, role, isLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const hasLoadedServerCart = useRef(false);
  const latestCartRef = useRef([]);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      setIsMounted(true);
      const savedCart = localStorage.getItem('hustfood_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {}
      }
    }, 0);

    return () => clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    latestCartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (!isMounted || isLoading || role !== 'customer') return;

    let isCurrent = true;

    async function loadServerCart() {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        if (!isCurrent || !res.ok) return;

        const serverItems = Array.isArray(data.items) ? data.items : [];
        if (serverItems.length > 0) {
          setCart(serverItems);
        } else if (latestCartRef.current.length > 0) {
          await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: latestCartRef.current })
          });
        }
      } finally {
        if (isCurrent) hasLoadedServerCart.current = true;
      }
    }

    loadServerCart();

    return () => {
      isCurrent = false;
    };
  }, [isMounted, isLoading, role, user?.id]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('hustfood_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  useEffect(() => {
    if (!isMounted || role !== 'customer' || !hasLoadedServerCart.current) return;

    const saveCart = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      }).catch(() => {});
    }, 250);

    return () => clearTimeout(saveCart);
  }, [cart, isMounted, role]);

  const addToCart = (product, selection = {}) => {
    const normalizedSelection = normalizeSelection(selection);
    const cartKey = createCartKey(product.id, normalizedSelection);
    const merchantInfo = getMerchantInfo(product);

    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        ...product,
        ...merchantInfo,
        cartKey,
        selectedOptions: {
          size: normalizedSelection.size,
          topping: normalizedSelection.topping,
          taste: normalizedSelection.taste
        },
        itemNote: normalizedSelection.note,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (cartKey, amount) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey || item.id === cartKey) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey && item.id !== cartKey));
  };

  const updateItemNote = (cartKey, note) => {
    setCart(prev => prev.map(item => item.cartKey === cartKey ? { ...item, itemNote: note } : item));
  };

  const clearCart = async () => {
    setCart([]);
    setVoucher(null);
    setVoucherError('');
    localStorage.removeItem('hustfood_cart');
    if (role === 'customer') {
      await fetch('/api/cart', { method: 'DELETE' }).catch(() => {});
    }
  };

  const applyVoucher = async (code) => {
    setVoucherError('');
    const res = await fetch('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal: totalPrice })
    });
    const data = await res.json();

    if (!res.ok) {
      setVoucher(null);
      setVoucherError(data.error || 'Mã giảm giá không hợp lệ');
      return false;
    }

    setVoucher(data);
    return true;
  };

  const clearVoucher = () => {
    setVoucher(null);
    setVoucherError('');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = calculateItemsSubtotal(cart);
  const cartGroups = useMemo(() => groupCartItems(cart), [cart]);
  const deliveryFee = cart.length > 0 ? DEMO_DELIVERY_FEE * Math.max(cartGroups.length, 1) : 0;
  const voucherIsUsable = voucher && totalPrice >= Number(voucher.minSubtotal || 0);
  const discount = voucherIsUsable ? calculateVoucherDiscount(totalPrice, voucher) : 0;
  const finalTotal = calculateFinalTotal(totalPrice - discount, deliveryFee);
  
  return (
    <CartContext.Provider value={{
      cart,
      cartGroups,
      voucher,
      voucherError,
      discount,
      addToCart,
      applyVoucher,
      clearCart,
      clearVoucher,
      removeFromCart,
      updateItemNote,
      updateQuantity,
      totalItems,
      totalPrice,
      deliveryFee,
      finalTotal,
      isMounted
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
