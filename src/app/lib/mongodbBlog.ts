import mongoose, { Schema } from "mongoose";

type BlogPostDocument = {
    _id: mongoose.Types.ObjectId;
    blog_title: string;
    blog_description?: string;
    blog_content?: string;
    blog_image?: string;
    blog_slug?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type BlogPost = {
    _id: string;
    blog_title: string;
    blog_description: string;
    blog_content: string;
    blog_image: string;
    blog_slug: string;
    createdAt: string;
    updatedAt: string;
};

const MONGODB_URI_BLOG = process.env.MONGODB_URI_BLOG || "";
const BLOG_COLLECTION = process.env.MONGODB_BLOG_COLLECTION || "blogs";

const blogSchema = new Schema<BlogPostDocument>(
    {
        blog_title: { type: String, required: true },
        blog_description: { type: String },
        blog_content: { type: String },
        blog_image: { type: String },
        blog_slug: { type: String },
    },
    {
        timestamps: true,
        collection: BLOG_COLLECTION,
    }
);

type MongooseBlogCache = {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
};

let cachedBlog = (global as typeof globalThis & { mongooseBlog?: MongooseBlogCache }).mongooseBlog;

if (!cachedBlog) {
    cachedBlog = (global as typeof globalThis & { mongooseBlog?: MongooseBlogCache }).mongooseBlog = {
        conn: null,
        promise: null,
    };
}

async function dbBlogConnect() {
    if (!cachedBlog) {
        cachedBlog = {
            conn: null,
            promise: null,
        };
    }

    if (cachedBlog.conn) return cachedBlog.conn;
    if (!cachedBlog.promise) {
        const conn = mongoose.createConnection(MONGODB_URI_BLOG, {
            bufferCommands: false,
        });
        cachedBlog.promise = conn.asPromise().then(() => conn);
    }
    cachedBlog.conn = await cachedBlog.promise;
    return cachedBlog.conn;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
    if (!MONGODB_URI_BLOG) {
        return [];
    }

    try {
        const conn = await dbBlogConnect();
        const BlogModel = conn.models.Blog || conn.model<BlogPostDocument>("Blog", blogSchema);

        const posts = await BlogModel.find({})
            .sort({ createdAt: -1 })
            .lean<BlogPostDocument[]>()
            .exec();

        return posts.map((post) => ({
            _id: post._id?.toString?.() ?? "",
            blog_title: post.blog_title ?? "Untitled blog",
            blog_description: post.blog_description ?? "",
            blog_content: post.blog_content ?? "",
            blog_image: post.blog_image ?? "",
            blog_slug: post.blog_slug ?? "",
            createdAt: post.createdAt ? post.createdAt.toISOString() : "",
            updatedAt: post.updatedAt ? post.updatedAt.toISOString() : "",
        }));
    } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return [];
    }
}

export default dbBlogConnect;
