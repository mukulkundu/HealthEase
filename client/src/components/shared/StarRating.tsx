import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisplayProps {
  readonly: true;
  rating: number;
  size?: "sm" | "md" | "lg";
}

interface InputProps {
  readonly: false;
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

type Props = DisplayProps | InputProps;

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function StarRating(props: Props) {
  const [hovered, setHovered] = useState(0);
  const size = props.size ?? "md";
  const iconClass = sizeMap[size];

  if (props.readonly) {
    const { rating } = props;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              iconClass,
              i <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  }

  const { value, onChange } = props;
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              iconClass,
              "transition-colors",
              i <= active
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}
