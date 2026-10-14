import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/app/lib/mongodbBlog";
import { getNftByPostSlug } from "@/app/lib/mongodbNft";
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

    const postNft = await getNftByPostSlug(post.blog_slug);

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-20">
            <Link href="/" className="mb-8 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
                ← Back to home
            </Link>

            <article className="overflow-hidden rounded-xl bg-white shadow-sm">
                {post.blog_image ? (
                    <div className="relative h-80 w-full">
                        <Image
                            src={post.blog_image}
                            alt={post.blog_title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 900px"
                        />
                    </div>
                ) : null}

                <div className="p-8 md:p-10">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "Blog"}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{post.blog_title}</h1>
                        {postNft ? (
                            <Link
                                href={`/nft/${postNft.id}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-800 hover:bg-violet-100"
                                aria-label="View this post's NFT"
                            >
                                <span aria-hidden="true">✦</span>
                                NFT
                            </Link>
                        ) : null}
                    </div>

                    <div className="mt-6 text-lg leading-8 text-gray-700">
                        {post.blog_description ? <p className="mb-6 font-medium">{post.blog_description}</p> : null}
                        <div dangerouslySetInnerHTML={{ __html: post.blog_content || "" }} />
                    </div>
                    {!postNft ? <PostNftMinter post={post} /> : null}
                </div>
            </article>
        </main>
    );
}
