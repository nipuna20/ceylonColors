"use client";
import { useState, useEffect } from "react";

// ...rest of your BannerSlider code


// Add your own images here
const SLIDES = [
  {
    src: "https://t4.ftcdn.net/jpg/14/54/45/03/240_F_1454450330_HcfMqefEqA7RtysP5gxsMgWuaNG4wTiF.jpg",
    alt: "Elegant floral banner"
  },
  {
    src: "https://t4.ftcdn.net/jpg/05/64/06/13/240_F_564061324_1Wuqyag2z7z3KO4lqYERspH3b8oWHrhK.jpg", // or your other uploaded image
    alt: "Same Day Delivery"
  },
  {
    src: "https://img.freepik.com/premium-vector/flat-design-florist-job-facebook-template_23-2150052729.jpg",
    alt: "Kitchen electronics"
  }
];

export default function BannerSlider() {
  const [index, setIndex] = useState(0);

  // Auto-change slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i === SLIDES.length - 1 ? 0 : i + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  function prev() {
    setIndex(i => (i === 0 ? SLIDES.length - 1 : i - 1));
  }
  function next() {
    setIndex(i => (i === SLIDES.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="relative w-full flex justify-center bg-neutral-50 mb-8">
      <img
        src={SLIDES[index].src}
        alt={SLIDES[index].alt}
        className="w-full max-h-[450px] object-cover shadow-md border-b border-neutral-200 rounded-b-2xl"
        style={{ objectPosition: "center", minHeight: 190, transition: "opacity 0.5s" }}
      />
      {/* Prev/Next buttons */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow rounded-full w-10 h-10 flex items-center justify-center text-xl"
        aria-label="Previous"
        type="button"
      >‹</button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow rounded-full w-10 h-10 flex items-center justify-center text-xl"
        aria-label="Next"
        type="button"
      >›</button>
      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full ${i === index ? "bg-blue-600" : "bg-white border border-neutral-300"}`}
            aria-label={`Go to slide ${i + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}