import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

export function Logo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "wide";
}) {
  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-40 w-40",
    wide: "h-28 w-full max-w-[220px]",
  };

  return (
    <Image
      src="/logo.png"
      alt={APP_NAME}
      width={512}
      height={512}
      className={`${sizes[size]} rounded-xl object-contain`}
      priority
    />
  );
}
