import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Late Gate mark: receipt with a gate-blue stamp. Served from /public so it can be reused as an icon. */
export function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  return <Image src="/late-gate-mark.svg" alt="" width={size} height={size} className={cn("shrink-0 select-none", className)} unoptimized priority />;
}
