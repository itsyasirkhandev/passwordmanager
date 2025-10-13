import type { SVGProps } from "react";

export function CipherVaultLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>CipherVault Logo</title>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 11.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
      <path d="M12 11.5v4" />
    </svg>
  );
}
