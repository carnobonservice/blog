import mongoose, { Schema } from "mongoose";

type UserDocument = {
  _id: mongoose.Types.ObjectId;
  walletAddress: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
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
  createdAt: string;
  updatedAt: string;
};

const MONGODB_URI_USER = process.env.MONGODB_URI_USER || process.env.MONGODB_URI_BLOG || "";
const USER_COLLECTION = process.env.MONGODB_USER_COLLECTION || "users";

const userSchema = new Schema<UserDocument>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: "New member", trim: true },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
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
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function findOrCreateUser(walletAddress: string): Promise<User> {
  const conn = await dbUserConnect();
  const UserModel = conn.models.User || conn.model<UserDocument>("User", userSchema);
  const user = await UserModel.findOneAndUpdate(
    { walletAddress },
    { $setOnInsert: { walletAddress } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean<UserDocument>().exec();

  if (!user) throw new Error("Unable to create or find user");
  return toUser(user);
}
