"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";

export function QrCodeDisplay({
  value,
  label,
  size = 300,
}: {
  value: string;
  label: string;
  size?: number;
}) {
  const [generated, setGenerated] = useState<{
    value: string;
    source: string;
  }>();
  const [failure, setFailure] = useState<{
    value: string;
    message: string;
  }>();

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size,
      color: { dark: "#111217", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setGenerated({ value, source: dataUrl });
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setFailure({
            value,
            message:
              reason instanceof Error ? reason.message : "QR generation failed",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [size, value]);

  const source = generated?.value === value ? generated.source : undefined;
  const error = failure?.value === value ? failure.message : undefined;

  if (error) return <p role="alert" className="text-sm font-medium text-danger">{error}</p>;
  if (!source) return <div className="aspect-square w-full max-w-[300px] animate-pulse rounded-2xl bg-paper-deep" aria-label="Generating QR code" />;

  return (
    <div className="text-center">
      <div className="mx-auto w-fit rounded-2xl border border-ink bg-white p-3 shadow-[4px_4px_0_var(--ink)]">
        <Image src={source} alt={label} width={size} height={size} unoptimized className="h-auto w-full max-w-[300px]" />
      </div>
      <CopyButton value={value} className="mt-3">Copy QR payload</CopyButton>
    </div>
  );
}
