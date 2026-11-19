const { buildSchema, graphql } = require('graphql');
const Book = require('../models/Book');
const User = require('../models/User');

// Define GraphQL Schema
const schema = buildSchema(`
  type UserType {
    id: ID!
    username: String
    name: String
    email: String
    role: String
  }

  type BookType {
    id: ID!
    title: String!
    author: String
    category: String
    description: String
    coverImage: String
    averageRating: Float
    totalRatings: Int
    views: Int
    isPublic: Boolean
    createdAt: String
    uploadedBy: UserType
  }

  type LibraryStats {
    totalBooks: Int!
    totalViews: Int!
    averageSystemRating: Float!
    publicBooksCount: Int!
  }

  type Query {
    # Fetch all public books with optional category filter
    books(category: String, limit: Int): [BookType]
    
    # Fetch single book by ID
    book(id: ID!): BookType
    
    # Executive library summary stats
    stats: LibraryStats
  }
`);

// Root Resolvers
const rootValue = {
  books: async ({ category, limit = 50 }) => {
    const query = { isPublic: true };
    if (category && category !== 'All') {
      query.category = category;
    }
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('uploadedBy', 'username name email role');

    return books.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      author: b.author,
      category: b.category,
      description: b.description,
      coverImage: b.coverImage,
      averageRating: b.averageRating || 0,
      totalRatings: b.totalRatings || 0,
      views: b.views || 0,
      isPublic: b.isPublic,
      createdAt: b.createdAt ? b.createdAt.toISOString() : '',
      uploadedBy: b.uploadedBy ? {
        id: b.uploadedBy._id.toString(),
        username: b.uploadedBy.username,
        name: b.uploadedBy.name,
        email: b.uploadedBy.email,
        role: b.uploadedBy.role
      } : null
    }));
  },

  book: async ({ id }) => {
    const b = await Book.findById(id).populate('uploadedBy', 'username name email role');
    if (!b) return null;
    return {
      id: b._id.toString(),
      title: b.title,
      author: b.author,
      category: b.category,
      description: b.description,
      coverImage: b.coverImage,
      averageRating: b.averageRating || 0,
      totalRatings: b.totalRatings || 0,
      views: b.views || 0,
      isPublic: b.isPublic,
      createdAt: b.createdAt ? b.createdAt.toISOString() : '',
      uploadedBy: b.uploadedBy ? {
        id: b.uploadedBy._id.toString(),
        username: b.uploadedBy.username,
        name: b.uploadedBy.name,
        email: b.uploadedBy.email,
        role: b.uploadedBy.role
      } : null
    };
  },

  stats: async () => {
    const totalBooks = await Book.countDocuments();
    const publicBooksCount = await Book.countDocuments({ isPublic: true });
    const books = await Book.find();
    const totalViews = books.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const avgRating = books.length > 0
      ? Number((books.reduce((acc, curr) => acc + (curr.averageRating || 0), 0) / books.length).toFixed(1))
      : 0;

    return {
      totalBooks,
      publicBooksCount,
      totalViews,
      averageSystemRating: avgRating
    };
  }
};

module.exports = { schema, rootValue };
