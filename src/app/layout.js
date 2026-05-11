import "./globals.css";
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: "HustFood | Món Ngon Nhanh Chóng",
  description: "Đặt đồ ăn nhanh chóng, tiện lợi với HustFood.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
