import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile-page";

export const metadata: Metadata = {
  title: "Profile | Gather",
  description: "Your Gather profile and activity.",
};

export default function Profile() {
  return <ProfilePage />;
}
