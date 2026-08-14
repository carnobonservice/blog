import mongoose, { Schema } from "mongoose";

type ImageDocument = {
    _id: mongoose.Types.ObjectId;
    owner: string;
    url: string;
    publicId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type Image = {
    id: string;
    owner: string;
    url: string;
    publicId: string;
    createdAt: string;
    updatedAt: string;
};

const MONGODB_URI_USER = process.env.MONGODB_URI_USER || process.env.MONGODB_URI_BLOG || "";
const IMAGE_COLLECTION = process.env.MONGODB_IMAGE_COLLECTION || "images";

const imageSchema = new Schema<ImageDocument>(
    {
        owner: { type: String, required: true, index: true },
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
    },
    { timestamps: true, collection: IMAGE_COLLECTION },
);

type MongooseImageCache = {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
};

let cachedImage = (global as typeof globalThis & { mongooseImage?: MongooseImageCache }).mongooseImage;

if (!cachedImage) {
    cachedImage = (global as typeof globalThis & { mongooseImage?: MongooseImageCache }).mongooseImage = {
        conn: null,
        promise: null,
    };
}

async function dbImageConnect() {
    if (!MONGODB_URI_USER) throw new Error("Missing MongoDB connection string");
    if (cachedImage?.conn) return cachedImage.conn;

    if (!cachedImage?.promise) {
        cachedImage!.promise = mongoose.createConnection(MONGODB_URI_USER, { bufferCommands: false }).asPromise();
    }

    cachedImage!.conn = await cachedImage!.promise;
    return cachedImage!.conn;
}

function toImage(image: ImageDocument): Image {
    return {
        id: image._id.toString(),
        owner: image.owner,
        url: image.url,
        publicId: image.publicId,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
    };
}

export async function createImage(owner: string, url: string, publicId: string): Promise<Image> {
    const conn = await dbImageConnect();
    const ImageModel = conn.models.Image || conn.model<ImageDocument>("Image", imageSchema);

    const image = await ImageModel.create({ owner, url, publicId });
    return toImage(image);
}

export async function getImagesByOwner(owner: string): Promise<Image[]> {
    const conn = await dbImageConnect();
    const ImageModel = conn.models.Image || conn.model<ImageDocument>("Image", imageSchema);

    const images = await ImageModel.find({ owner })
        .sort({ createdAt: -1 })
        .lean<ImageDocument[]>()
        .exec();

    return images.map(toImage);
}