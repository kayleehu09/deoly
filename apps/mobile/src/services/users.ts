import { MOCK_CURRENT_USER_ID } from '../constants/mockCurrentUser';
import { mockUsers } from '../data/mockUsers';
import type { User } from '../types/models';

let mockUserStore = [...mockUsers];

export async function getCurrentUser(): Promise<User> {
  const user = mockUserStore.find((item) => item.id === MOCK_CURRENT_USER_ID);

  if (!user) {
    throw new Error('Mock current user not found.');
  }

  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return [...mockUserStore];
}

export async function getUserById(userId: string): Promise<User | undefined> {
  return mockUserStore.find((item) => item.id === userId);
}

// Future backend shape:
// export async function getCurrentUserFromApi(userId: string) {
//   const snapshot = await getDoc(doc(db, 'users', userId));
//   return snapshot.data();
// }
