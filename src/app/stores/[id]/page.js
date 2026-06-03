import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import styles from '@/app/page.module.css';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';
import { getStoreDistanceKm } from '@/lib/search';

function attachDemoProductRelations(products, profile, categories) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return products.map((product) => ({
    ...product,
    category: categoryById.get(product.categoryId) || null,
    owner: {
      id: product.ownerId,
      displayName: profile?.owner?.displayName || 'Người bán HustFood',
      merchantProfile: profile
    }
  }));
}

async function getStoreData(id) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const profile = store.merchantProfiles.find((item) => item.id === id && item.status === 'active');
    if (!profile) return null;

    const products = attachDemoProductRelations(
      store.products.filter((product) => (
        product.ownerId === profile.ownerId
        && product.isAvailable !== false
        && product.isHidden !== true
      )),
      profile,
      store.menuCategories || []
    );

    return { profile, products };
  }

  const { prisma } = await import('@/lib/prisma');
  const profile = await prisma.merchantProfile.findFirst({
    where: {
      id,
      status: 'active'
    },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true
        }
      }
    }
  });

  if (!profile) return null;

  const products = await prisma.product.findMany({
    where: {
      ownerId: profile.ownerId,
      isAvailable: true,
      isHidden: false
    },
    include: {
      category: true,
      owner: {
        select: {
          id: true,
          displayName: true,
          merchantProfile: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { profile, products };
}

export default async function StoreDetailPage({ params }) {
  const resolvedParams = params ? await params : {};
  const data = await getStoreData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { profile, products } = data;
  const distance = getStoreDistanceKm(profile);

  return (
    <main className={styles.main}>
      <Header />

      <section className={styles.storeDetailHero}>
        <div className="container">
          <Link href="/#stores" className={styles.clearFilter}>Quay lại tìm kiếm</Link>
          <div className={styles.storeDetailGrid}>
            <img src={profile.image || '/images/burger.png'} alt={profile.shopName} className={styles.storeDetailImage} />
            <div className={styles.storeDetailInfo}>
              <div className={styles.sectionSubtitle}>{profile.owner?.displayName || 'Người bán HustFood'}</div>
              <h1 className={styles.heroTitle}>{profile.shopName}</h1>
              <p className={styles.heroSubtitle}>{profile.address}</p>
              <div className={styles.storeDetailMeta}>
                <span>{profile.openTime} - {profile.closeTime}</span>
                <span>{profile.phone}</span>
                <span>{Number(profile.rating || 0).toFixed(1)} sao</span>
                <span>{Number(profile.reviewCount || 0).toLocaleString('vi-VN')} đánh giá</span>
                {distance !== null && <span>{distance.toFixed(1)} km</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.menuSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionSubtitle}>Menu cửa hàng</div>
            <h2 className={styles.sectionTitle}>Món đang bán</h2>
          </div>

          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <div className={styles.emptyResults}>
                <p>Cửa hàng hiện chưa có món đang bán.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
