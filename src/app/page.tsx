import { getBlogPosts } from "@/app/lib/mongodbBlog";
import { getNftPostSlugs } from "@/app/lib/mongodbNft";
import { SocialHome } from "@/components/social-home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialPosts = await getBlogPosts();
  const nftPostSlugs = await getNftPostSlugs(initialPosts.map((post) => post.blog_slug));
  return <SocialHome initialPosts={initialPosts} nftPostSlugs={nftPostSlugs} />;
}
