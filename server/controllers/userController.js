import { getFirestore } from '../config/firebase.js';

const USERS_COLLECTION = 'users';

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const db = getFirestore();
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    // Handle NOT_FOUND error (collection doesn't exist yet)
    if (error.code === 5 || error.message.includes('NOT_FOUND')) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No users found. Collection will be created when you add the first user.',
      });
    }

    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const userDoc = await db.collection(USERS_COLLECTION).doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const db = getFirestore();
    const userData = req.body;

    // Add timestamp
    userData.createdAt = new Date().toISOString();
    userData.updatedAt = new Date().toISOString();

    const docRef = await db.collection(USERS_COLLECTION).add(userData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...userData,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const updates = req.body;

    // Add updated timestamp
    updates.updatedAt = new Date().toISOString();

    await db.collection(USERS_COLLECTION).doc(id).update(updates);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id,
        ...updates,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    await db.collection(USERS_COLLECTION).doc(id).delete();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};
