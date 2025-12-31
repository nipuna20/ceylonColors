import { db } from "@/lib/db";
import { notFound } from "next/navigation";

interface PageProps {
  params: { slug: string };
}

/**
 * Product detail page. Fetches the product by slug and renders its details,
 * including images, description, price and vendor information. If the
 * product cannot be found or is not active the page triggers a 404 via
 * notFound().
 */
export default async function ProductPage({ params }: PageProps) {
  const product = await db.product.findFirst({
    where: { slug: params.slug, active: true },
    include: {
      images: true,
      vendor: true,
      category: true,
      reviews: { include: { user: true } },
      variants: true,
    },
  });
  if (!product) {
    notFound();
  }
  return (
    <main className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative w-full h-64 md:h-96">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[0]?.url ?? "https://picsum.photos/seed/placeholder/800/800"}
              alt={product.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {/* Could add thumbnails here */}
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
          <p className="text-sm text-gray-500 mb-4">by {product.vendor.shopName}</p>
          <p className="text-xl font-semibold mb-4">Rs {(product.priceCents / 100).toFixed(2)}</p>
          {product.description && (
            <p className="text-gray-700 mb-4">{product.description}</p>
          )}
          {product.variants.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="font-medium">Variants:</p>
              <ul className="list-disc list-inside">
                {product.variants.map((variant) => (
                  <li key={variant.id}>{variant.name}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Placeholder for Add to Cart button */}
          <button
            type="button"
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
          >
            Add to cart (client-side cart not implemented)
          </button>
        </div>
      </div>
      {/* Reviews section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {product.reviews.map((review) => (
              <li key={review.id} className="border p-4 rounded">
                <p className="font-medium">{review.user.name ?? review.user.email}</p>
                <p className="text-sm text-gray-600">Rating: {review.rating}/5</p>
                {review.comment && <p className="mt-2">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}