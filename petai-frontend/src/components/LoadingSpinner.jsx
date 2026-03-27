/**
 * LoadingSpinner
 * Reusable spinner component.
 * size: "sm" | "md" (default) | "lg"
 */
export default function LoadingSpinner({ size = "md" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} rounded-full border-emerald-200 border-t-emerald-600 animate-spin`}
      />
    </div>
  );
}
