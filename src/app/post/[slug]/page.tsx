import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/app/lib/mongodbBlog";
import { PostNftMinter } from "@/components/post-nft-minter";

export const dynamic = "force-dynamic";

type PostPageProps = {
    params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-20">
            <Link href="/" className="mb-8 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
                ← Back to home
            </Link>

            <article className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="relative h-80 w-full">
                    <Image
                        src={post.blog_image || "/sui_blog.png"}
                        alt={post.blog_title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 900px"
                    />
                </div>

                <div className="p-8 md:p-10">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "Blog"}
                    </p>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">{post.blog_title}</h1>

                    <div className="mt-6 text-lg leading-8 text-gray-700">
                        {post.blog_description ? <p className="mb-6 font-medium">{post.blog_description}</p> : null}
                        <div dangerouslySetInnerHTML={{ __html: post.blog_content || "" }} />
                    </div>
                    <PostNftMinter post={post} />
                </div>
            </article>
        </main>
    );
}
