import type { Metadata } from "next";
import { NftDetailPage } from "@/components/nft-detail-page";

export const metadata: Metadata = {
  title: "NFT details | Gather",
  description: "View a minted NFT on Gather.",
};

export default function NftPage() {
  return <NftDetailPage />;
}
