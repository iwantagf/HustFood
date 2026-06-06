import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import styles from '@/app/page.module.css';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';
import {
  attachProductReviewStats,
  createReviewStats,
  hydrateDemoReviews,
  serializeReview
} from '@/lib/reviews';
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

function getProfileReviews(profile, reviews, products) {
  const productIds = new Set(products.map((product) => product.id));

  return reviews.filter((review) => (
    review.merchantId === profile.ownerId || productIds.has(review.productId)
  ));
}

function formatReviewDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('vi-VN');
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
    const reviews = getProfileReviews(
      profile,
      hydrateDemoReviews(store.reviews, { users: store.users, products: store.products }),
      products
    );

    return {
      profile: {
        ...profile,
        reviewStats: createReviewStats(reviews)
      },
      products: attachProductReviewStats(products, reviews),
      reviews
    };
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

  const [products, rawReviews] = await Promise.all([
    prisma.product.findMany({
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
    }),
    prisma.review.findMany({
      where: {
        merchantId: profile.ownerId,
        status: 'visible'
      },
      include: {
        customer: {
          select: {
            displayName: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);
  const reviews = rawReviews.map(serializeReview);

  return {
    profile: {
      ...profile,
      reviewStats: createReviewStats(reviews)
    },
    products: attachProductReviewStats(products, reviews),
    reviews
  };
}

export default async function StoreDetailPage({ params }) {
  const resolvedParams = params ? await params : {};
  const data = await getStoreData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { profile, products, reviews } = data;
  const distance = getStoreDistanceKm(profile);
  const reviewStats = profile.reviewStats || createReviewStats([]);
  const displayRating = reviewStats.count
    ? reviewStats.averageFoodRating
    : Number(profile.rating || 0);
  const displayReviewCount = reviewStats.count || Number(profile.reviewCount || 0);

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
                <span>{displayRating.toFixed(1)} sao</span>
                <span>{displayReviewCount.toLocaleString('vi-VN')} đánh giá</span>
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

      <section className={styles.reviewSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionSubtitle}>Đánh giá từ khách hàng</div>
            <h2 className={styles.sectionTitle}>Review cửa hàng và món ăn</h2>
          </div>

          <div className={styles.reviewOverview}>
            <div>
              <span className={styles.reviewOverviewValue}>{reviewStats.count ? reviewStats.averageFoodRating.toFixed(1) : '0.0'}</span>
              <span className={styles.reviewOverviewLabel}>Điểm món ăn</span>
            </div>
            <div>
              <span className={styles.reviewOverviewValue}>{reviewStats.count.toLocaleString('vi-VN')}</span>
              <span className={styles.reviewOverviewLabel}>Đánh giá hiển thị</span>
            </div>
            <div>
              <span className={styles.reviewOverviewValue}>{reviewStats.imageCount.toLocaleString('vi-VN')}</span>
              <span className={styles.reviewOverviewLabel}>Ảnh review</span>
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className={styles.reviewList}>
              {reviews.map((review) => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewCardHeader}>
                    <div>
                      <h3>{review.customerName}</h3>
                      <p>{review.productName || profile.shopName}</p>
                    </div>
                    <div className={styles.reviewRating}>
                      <span>{review.foodRating}/5 sao</span>
                      {review.shipperRating && <span>Giao hàng {review.shipperRating}/5</span>}
                    </div>
                  </div>
                  {review.comment && <p className={styles.reviewText}>{review.comment}</p>}
                  {review.images.length > 0 && (
                    <div className={styles.reviewPhotoGrid}>
                      {review.images.map((image, index) => (
                        <Image
                          key={image}
                          src={image}
                          alt={`Ảnh review ${index + 1}`}
                          className={styles.reviewPhoto}
                          width={180}
                          height={180}
                          unoptimized
                        />
                      ))}
                    </div>
                  )}
                  {review.createdAt && <time className={styles.reviewDate}>{formatReviewDate(review.createdAt)}</time>}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyResults}>
              <p>Cửa hàng chưa có review hiển thị từ khách hàng.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
