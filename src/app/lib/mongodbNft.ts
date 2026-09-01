import mongoose, { Schema } from "mongoose";

type NftDocument = {
    _id: mongoose.Types.ObjectId;
    owner: string;
    name: string;
    description: string;
    image: string;
    digest: string;
    postSlug?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type Nft = {
    id: string;
    owner: string;
    name: string;
    description: string;
    image: string;
    digest: string;
    postSlug: string;
    createdAt: string;
    updatedAt: string;
};

const MONGODB_URI_USER = process.env.MONGODB_URI_USER || process.env.MONGODB_URI_BLOG || "";
const NFT_COLLECTION = process.env.MONGODB_NFT_COLLECTION || "nfts";

const nftSchema = new Schema<NftDocument>(
    {
        owner: { type: String, required: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        image: { type: String, required: true },
        digest: { type: String, required: true, unique: true, index: true },
        // At most one official collectible is recorded for each blog post.
        postSlug: { type: String, unique: true, sparse: true, index: true },
    },
    { timestamps: true, collection: NFT_COLLECTION },
);

type MongooseNftCache = {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
};

let cachedNft = (global as typeof globalThis & { mongooseNft?: MongooseNftCache }).mongooseNft;

if (!cachedNft) {
    cachedNft = (global as typeof globalThis & { mongooseNft?: MongooseNftCache }).mongooseNft = {
        conn: null,
        promise: null,
    };
}

async function dbNftConnect() {
    if (!MONGODB_URI_USER) throw new Error("Missing MongoDB connection string");
    if (cachedNft?.conn) return cachedNft.conn;

    if (!cachedNft?.promise) {
        cachedNft!.promise = mongoose.createConnection(MONGODB_URI_USER, { bufferCommands: false }).asPromise();
    }

    cachedNft!.conn = await cachedNft!.promise;
    return cachedNft!.conn;
}

function toNft(nft: NftDocument): Nft {
    return {
        id: nft._id.toString(),
        owner: nft.owner,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        digest: nft.digest,
        postSlug: nft.postSlug ?? "",
        createdAt: nft.createdAt.toISOString(),
        updatedAt: nft.updatedAt.toISOString(),
    };
}

export async function createNft(
    owner: string,
    payload: { name: string; description: string; image: string; digest: string; postSlug?: string },
): Promise<Nft> {
    const conn = await dbNftConnect();
    const NftModel = conn.models.Nft || conn.model<NftDocument>("Nft", nftSchema);

    const existing = await NftModel.findOne({ digest: payload.digest }).lean<NftDocument>().exec();
    if (existing) {
        return toNft(existing);
    }

    if (payload.postSlug) {
        const existingPostNft = await NftModel.findOne({ postSlug: payload.postSlug }).lean<NftDocument>().exec();
        if (existingPostNft) return toNft(existingPostNft);
    }

    const nft = await NftModel.create({
        owner,
        name: payload.name,
        description: payload.description,
        image: payload.image,
        digest: payload.digest,
        postSlug: payload.postSlug,
    });

    return toNft(nft);
}

export async function getNftsByOwner(owner: string): Promise<Nft[]> {
    const conn = await dbNftConnect();
    const NftModel = conn.models.Nft || conn.model<NftDocument>("Nft", nftSchema);

    const nfts = await NftModel.find({ owner })
        .sort({ createdAt: -1 })
        .lean<NftDocument[]>()
        .exec();

    return nfts.map(toNft);
}

export async function getNftById(id: string): Promise<Nft | null> {
    if (!mongoose.isObjectIdOrHexString(id)) return null;

    const conn = await dbNftConnect();
    const NftModel = conn.models.Nft || conn.model<NftDocument>("Nft", nftSchema);
    const nft = await NftModel.findById(id).lean<NftDocument | null>().exec();
    return nft ? toNft(nft) : null;
}
