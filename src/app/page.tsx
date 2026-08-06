import { getBlogPosts } from "@/app/lib/mongodbBlog";
import { SocialHome } from "@/components/social-home";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <SocialHome initialPosts={await getBlogPosts()} />;
}
