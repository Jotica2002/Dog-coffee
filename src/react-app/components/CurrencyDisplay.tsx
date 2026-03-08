interface CurrencyDisplayProps {
  amountUsd: number;
  exchangeRate?: number;
  amountVesExact?: number;
  showVes?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CurrencyDisplay({
  amountUsd,
  exchangeRate = 0,
  amountVesExact,
  showVes = true,
  className = "",
  size = "md",
}: CurrencyDisplayProps) {
  const amountVes = amountVesExact !== undefined ? amountVesExact : amountUsd * exchangeRate;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl font-bold",
  };

  const formatUsd = (val: number) =>
    new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);

  const formatVes = (val: number) =>
    new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 2,
    }).format(val);

  return (
    <div className={`${className}`}>
      <div className={`${sizeClasses[size]} text-foreground`}>
        {formatUsd(amountUsd)}
      </div>
      {showVes && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatVes(amountVes)}
        </div>
      )}
    </div>
  );
}
