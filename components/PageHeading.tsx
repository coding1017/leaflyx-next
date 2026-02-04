// components/PageHeading.tsx
import { ReactNode } from "react";

type PageHeadingProps = {
  children: ReactNode;
};

export default function PageHeading({ children }: PageHeadingProps) {
  return (
    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
      {children}
    </h1>
  );
}
