export default function StarRating({ rating = 0, max = 5, size = 'sm', interactive = false, onChange }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <svg key={i}
            className={`${sizes[size]} ${filled ? 'text-amber-400' : 'text-gray-200'}
              ${interactive ? 'cursor-pointer hover:text-amber-300 transition-colors' : ''}`}
            onClick={() => interactive && onChange?.(i + 1)}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462
              c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755
              1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539
              -1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461
              a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
      {rating > 0 && <span className="ml-1 text-xs font-medium text-gray-500">{Number(rating).toFixed(1)}</span>}
    </div>
  );
}
