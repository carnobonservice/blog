import mongoose, { Schema } from "mongoose";

type UserDocument = {
  _id: mongoose.Types.ObjectId;
  walletAddress: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string;
  coverImage: string;
  nftMintedDigest: string;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  walletAddress: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string;
  coverImage: string;
  nftMintedDigest: string;
  createdAt: string;
  updatedAt: string;
};

type UserUpdates = Partial<Pick<UserDocument, "displayName" | "bio" | "location" | "website" | "profileImage" | "coverImage" | "nftMintedDigest">>;

const MONGODB_URI_USER = process.env.MONGODB_URI_USER || process.env.MONGODB_URI_BLOG || "";
const USER_COLLECTION = process.env.MONGODB_USER_COLLECTION || "users";

const userSchema = new Schema<UserDocument>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: "New member", trim: true },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    nftMintedDigest: { type: String, default: "" },
  },
  { timestamps: true, collection: USER_COLLECTION },
);

type MongooseUserCache = {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
};

let cachedUser = (global as typeof globalThis & { mongooseUser?: MongooseUserCache }).mongooseUser;

if (!cachedUser) {
  cachedUser = (global as typeof globalThis & { mongooseUser?: MongooseUserCache }).mongooseUser = {
    conn: null,
    promise: null,
  };
}

async function dbUserConnect() {
  if (!MONGODB_URI_USER) throw new Error("Missing MongoDB user connection string");
  if (cachedUser?.conn) return cachedUser.conn;

  if (!cachedUser?.promise) {
    cachedUser!.promise = mongoose.createConnection(MONGODB_URI_USER, { bufferCommands: false }).asPromise();
  }

  cachedUser!.conn = await cachedUser!.promise;
  return cachedUser!.conn;
}

function toUser(user: UserDocument): User {
  return {
    id: user._id.toString(),
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    bio: user.bio,
    location: user.location,
    website: user.website,
    profileImage: user.profileImage,
    coverImage: user.coverImage,
    nftMintedDigest: user.nftMintedDigest,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function findOrCreateUser(walletAddress: string, updates: UserUpdates = {}): Promise<User> {
  const conn = await dbUserConnect();
  const UserModel = conn.models.User || conn.model<UserDocument>("User", userSchema);
  const updatePayload = Object.keys(updates).length > 0
    ? { $setOnInsert: { walletAddress }, $set: updates }
    : { $setOnInsert: { walletAddress } };

  const user = await UserModel.findOneAndUpdate(
    { walletAddress },
    updatePayload,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean<UserDocument>().exec();

  if (!user) throw new Error("Unable to create or find user");
  return toUser(user);
}
