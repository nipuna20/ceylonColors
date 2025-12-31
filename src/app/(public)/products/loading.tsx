// src/app/(public)/products/loading.tsx
export default function Loading() {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="h-16 w-full rounded-2xl bg-gray-100 animate-pulse" />
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  