"use client";
import { createContext, useState, useContext, useEffect } from 'react';
import { DEMO_DELIVERY_FEE, calculateFinalTotal, calculateItemsSubtotal } from '@/lib/pricing';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem('hustfood_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('hustfood_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = calculateItemsSubtotal(cart);
  const deliveryFee = DEMO_DELIVERY_FEE;
  const finalTotal = calculateFinalTotal(totalPrice, deliveryFee);
  
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice, deliveryFee, finalTotal, isMounted }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
