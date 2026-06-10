import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { getDemoStore, isDemoMode } from "@/lib/demo/store";
import {
  createReviewStats,
  hydrateDemoReviews,
  serializeReview
} from "@/lib/reviews";
import { attachProductSalesStats } from "@/lib/sales";
import {
  PRICE_FILTERS,
  getStoreDistanceKm,
  hasActiveFilters,
  normalizeSearchParams,
  productMatchesFilters,
  sortTrendingProducts,
  storeMatchesFilters
} from "@/lib/search";

function attachDemoRelations(products, merchantProfiles, categories) {
  const profileByOwnerId = new Map(merchantProfiles.map((profile) => [profile.ownerId, profile]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return products.map((product) => ({
    ...product,
    category: categoryById.get(product.categoryId) || null,
    owner: {
      id: product.ownerId,
      displayName: profileByOwnerId.get(product.ownerId)?.owner?.displayName || 'Người bán HustFood',
      merchantProfile: profileByOwnerId.get(product.ownerId) || null
    }
  }));
}

function attachStoreReviewStats(profiles, reviews) {
  return profiles.map((profile) => {
    const reviewStats = createReviewStats(reviews.filter((review) => review.merchantId === profile.ownerId));

    return {
      ...profile,
      rating: reviewStats.count ? reviewStats.averageFoodRating : profile.rating,
      reviewCount: reviewStats.count ? reviewStats.count : profile.reviewCount,
      reviewStats
    };
  });
}

export default async function Home({ searchParams }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = normalizeSearchParams(resolvedSearchParams);
  const hasFilters = hasActiveFilters(filters);
  let products = [];
  let merchantProfiles = [];
  let visibleProducts = [];
  let visibleStores = [];
  let suggestedProducts = [];
  try {
    if (isDemoMode()) {
      const store = getDemoStore();
      merchantProfiles = store.merchantProfiles.filter((profile) => profile.status === 'active');
      products = attachDemoRelations(
        store.products.filter((product) => product.isAvailable !== false && product.isHidden !== true),
        merchantProfiles,
        store.menuCategories || []
      );
      const reviews = hydrateDemoReviews(store.reviews, { users: store.users });
      products = attachProductSalesStats(products, store.orders);
      merchantProfiles = attachStoreReviewStats(merchantProfiles, reviews);
    } else {
      const { prisma } = await import('@/lib/prisma');
      const [productData, profileData] = await Promise.all([
        prisma.product.findMany({
          where: {
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
        }),
        prisma.merchantProfile.findMany({
          where: { status: 'active' },
          include: {
            owner: {
              select: {
                displayName: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        })
      ]);
      const merchantIds = profileData.map((profile) => profile.ownerId).filter(Boolean);

      const [rawReviews, completedOrders] = merchantIds.length
        ? await Promise.all([
          prisma.review.findMany({
            where: {
              status: 'visible',
              merchantId: { in: merchantIds }
            },
            include: {
              customer: {
                select: {
                  displayName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.order.findMany({
            where: {
              status: 'completed',
              merchantId: { in: merchantIds }
            },
            select: {
              status: true,
              items: true
            }
          })
        ])
        : [[], []];
      const reviews = rawReviews.map(serializeReview);

      products = attachProductSalesStats(productData, completedOrders);
      merchantProfiles = attachStoreReviewStats(profileData, reviews);
    }

    visibleProducts = products.filter((product) => productMatchesFilters(product, filters));
    visibleStores = merchantProfiles.filter((profile) => storeMatchesFilters(profile, filters));
    suggestedProducts = sortTrendingProducts(products).slice(0, 4);
  } catch (e) {
    console.error("Error fetching home data:", e);
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
          <Image
            src="/images/burger.png"
            alt="Delicious Burger"
            width={600}
            height={600}
            className={styles.heroImage}
            priority
          />
        </div>
      </section>

      <section id="stores" className={styles.storeSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionSubtitle}>Gian Hàng HustFood</div>
            <h2 className={styles.sectionTitle}>Tìm món và cửa hàng</h2>
          </div>

          <form action="/" className={styles.searchPanel}>
            <div className={styles.searchField}>
              <label htmlFor="q">Từ khóa</label>
              <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Tên món, quán, địa chỉ" />
            </div>
            <div className={styles.searchField}>
              <label htmlFor="price">Giá</label>
              <select id="price" name="price" defaultValue={filters.price}>
                <option value="">Tất cả</option>
                {Object.entries(PRICE_FILTERS).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.searchField}>
              <label htmlFor="distance">Khoảng cách</label>
              <select id="distance" name="distance" defaultValue={filters.distance || ''}>
                <option value="">Tất cả</option>
                <option value="1">Trong 1 km</option>
                <option value="3">Trong 3 km</option>
                <option value="5">Trong 5 km</option>
              </select>
            </div>
            <div className={styles.searchField}>
              <label htmlFor="rating">Đánh giá</label>
              <select id="rating" name="rating" defaultValue={filters.rating || ''}>
                <option value="">Tất cả</option>
                <option value="4">Từ 4.0 sao</option>
                <option value="4.5">Từ 4.5 sao</option>
              </select>
            </div>
            <div className={styles.searchActions}>
              <button type="submit" className="btn btn-primary">Tìm kiếm</button>
              {hasFilters && <Link href="/" className={styles.clearFilter}>Xóa lọc</Link>}
            </div>
          </form>

          <div className={styles.resultSummary}>
            <span>{visibleStores.length} cửa hàng</span>
            <span>{visibleProducts.length} món phù hợp</span>
          </div>

          <div className={styles.storeGrid}>
            {visibleStores.map((profile) => {
              const distance = getStoreDistanceKm(profile);
              const reviewStats = profile.reviewStats;
              const rating = reviewStats?.count ? reviewStats.averageFoodRating : Number(profile.rating || 0);
              const reviewCount = reviewStats?.count || Number(profile.reviewCount || 0);
              const hasReviewScore = reviewCount > 0 && rating > 0;

              return (
              <Link key={profile.id} href={`/stores/${profile.id}`} className={styles.storeCard}>
                <Image
                  src={profile.image || '/images/burger.png'}
                  alt={profile.shopName}
                  width={420}
                  height={180}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.storeImage}
                  unoptimized
                />
                <div className={styles.storeInfo}>
                  <div className={styles.storeOwner}>{profile.owner?.displayName || 'Người bán HustFood'}</div>
                  <h3 className={styles.storeName}>{profile.shopName}</h3>
                  <p className={styles.storeAddress}>{profile.address}</p>
                  <div className={styles.storeMeta}>
                    <span>{profile.openTime} - {profile.closeTime}</span>
                    {hasReviewScore ? (
                      <>
                        <span>{rating.toFixed(1)} sao</span>
                        <span>{reviewCount.toLocaleString('vi-VN')} đánh giá</span>
                      </>
                    ) : (
                      <span>Chưa có đánh giá</span>
                    )}
                    {distance !== null && <span>{distance.toFixed(1)} km</span>}
                  </div>
                </div>
              </Link>
              );
            })}
            {visibleStores.length === 0 && (
              <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
                Không tìm thấy cửa hàng phù hợp.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section id="menu" className={styles.menuSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionSubtitle}>Khám Phá Hương Vị</div>
            <h2 className={styles.sectionTitle}>{hasFilters ? 'Kết quả món ăn' : 'Món Ngon Nổi Bật'}</h2>
          </div>
          
          <div className={styles.productGrid}>
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {visibleProducts.length === 0 && (
              <div className={styles.emptyResults}>
                <p>Không có món phù hợp với bộ lọc hiện tại.</p>
              </div>
            )}
          </div>

          {visibleProducts.length === 0 && suggestedProducts.length > 0 && (
            <div className={styles.suggestionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionSubtitle}>Gợi ý thay thế</div>
                <h2 className={styles.sectionTitle}>Món đang nổi bật</h2>
              </div>
              <div className={styles.productGrid}>
                {suggestedProducts.map((product) => (
                  <ProductCard key={`suggest-${product.id}`} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
