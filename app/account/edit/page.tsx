import EditProfileForm from "@/components/account/EditProfileForm";

export const metadata = {
  title: "Edit profile — Leaflyx",
};

export default function EditProfilePage() {
  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <h1 className="text-xl font-semibold text-white">Edit profile</h1>
        <p className="mt-1 text-sm text-white/70">
          Update your contact info and public profile.
        </p>

        {/* ✅ Anchor target for “Shipping address” pill */}
        <div
          id="address"
          className="mt-6 scroll-mt-28"
          aria-hidden="true"
        />

        <EditProfileForm />
      </div>
    </div>
  );
}
