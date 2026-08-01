import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/app/lib/mongodbBlog";

export const dynamic = "force-dynamic";

const Home = async () => {
  const posts = await getBlogPosts();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-24">
      <section className="flex flex-col gap-6 lg:flex-row">
        <div className="relative min-h-[400px] overflow-hidden bg-black lg:basis-3/4">
          <Image
            src="/sui_blog.png"
            alt="Blog banner"
            fill
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, 75vw"
          />
        </div>
        <div className="lg:basis-1/4">
          <h1 className="text-4xl font-bold">Welcome to My Blog</h1>
          <p className="mt-4 text-lg text-gray-700">
            This is a simple blog built with Next.js and Tailwind CSS.
          </p>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link
              key={post._id}
              href={post.blog_slug ? `/post/${post.blog_slug}` : "/"}
              className="block overflow-hidden bg-white shadow-md transition-transform hover:-translate-y-1"
            >
              <article>
                <div className="relative h-64">
                  <Image
                    src={post.blog_image || "/sui_blog.png"}
                    alt={post.blog_title}
                    fill
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{post.blog_title}</h2>
                  <p className="mt-2 text-gray-600">
                    {post.blog_description || post.blog_content?.slice(0, 140) || "No description available."}
                  </p>
                  <span className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
                    Read more →
                  </span>
                </div>
              </article>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600">
            <p>No blog posts were fetched from MongoDB yet.</p>
            <p className="mt-2 text-sm">
              Please add the MONGODB_URI_BLOG environment variable and data in the blogs collection.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;