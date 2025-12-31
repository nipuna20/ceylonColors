// src/components/ProductCard.tsx
import Link from "next/link";

export default function ProductCard({
  product,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    priceCents: number;
    image: string | null;
    vendorName: string;
    rating: number; // 0..5
    reviewCount: number;
    inStock: boolean;
  };
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group border rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative h-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            product.image ??
            "https://picsum.photos/seed/placeholder/600/400"
          }
          alt={product.title}
          className="w-full h-full object-cover"
        />
        {!product.inStock && (
          <div className="absolute left-2 top-2 rounded-md bg-red-600/90 px-2 py-0.5 text-[11px] font-medium text-white">
            Out of stock
          </div>
        )}
      </div>

      <div className="p-4 space-y-1">
        <div className="line-clamp-2 font-medium">{product.title}</div>
        <div className="text-xs text-gray-500">by {product.vendorName}</div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[15px] font-semibold">
            Rs {(product.priceCents / 100).toFixed(2)}
          </div>
          <RatingStars value={product.rating} count={product.reviewCount} />
        </div>
      </div>
    </Link>
  );
}

function RatingStars({ value, count }: { value: number; count: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-1 text-xs text-gray-600">
      <span aria-hidden>{"★".repeat(full) + "☆".repeat(5 - full)}</span>
      <span>
        {value.toFixed(1)} ({count})
      </span>
    </div>
  );
}
