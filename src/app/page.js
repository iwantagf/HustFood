import styles from "./page.module.css";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";


export default async function Home() {
  let products = [];
  try {
    const { prisma } = await import('@/lib/prisma');
    products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error("Error fetching products:", e);
  }

  return (
    <main className={styles.main}>
      <Header />

      {/* Hero Section */}
      <section className={`${styles.hero} container`}>
        <div className={`${styles.heroText} animate-slide-up`}>
          <span className={styles.badge}>🔥 Mới: Combo Sinh Viên Chỉ 49k</span>
          <h1 className={styles.heroTitle}>
            Vị Ngon Trên <br /> Từng <span>Ngón Tay</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Thưởng thức burger thượng hạng và gà rán giòn rụm được chế biến từ những nguyên liệu tươi ngon nhất ngay tại nhà.
          </p>
          <div className={styles.heroActions}>
            <a href="#menu" className="btn btn-primary">Đặt Hàng Ngay</a>
          </div>
        </div>
        
        <div className={`${styles.heroImageContainer} animate-fade-in`}>
          <div className={styles.heroImageBlob}></div>
          <img src="/images/burger.png" alt="Delicious Burger" className={styles.heroImage} />
        </div>
      </section>

      {/* Featured Menu Section */}
      <section id="menu" className={styles.menuSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionSubtitle}>Khám Phá Hương Vị</div>
            <h2 className={styles.sectionTitle}>Món Ngon Nổi Bật</h2>
          </div>
          
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && <p style={{textAlign: 'center', width: '100%'}}>Thực đơn đang trống, vui lòng chờ Quản trị viên cập nhật!</p>}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
