// components/Container.tsx
import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string; // optional extra classes if you ever need them
};

export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 py-10 ${className}`}>
      {children}
    </div>
  );
}
