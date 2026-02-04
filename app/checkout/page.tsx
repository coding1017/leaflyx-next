// app/checkout/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import Container from "@/components/Container";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout · Leaflyx",
  description: "Secure checkout for premium THCA goods.",
  robots: {
    index: false, // ✅ keep checkout out of Google
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <Container>
      <CheckoutClient />
    </Container>
  );
}
