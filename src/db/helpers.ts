import { initDB } from './db'

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB()
  return db.getAll(storeName)
}

export async function getById<T>(storeName: string, id: string | number): Promise<T | undefined> {
  const db = await initDB()
  return db.get(storeName, id)
}

export async function putItem<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB()
  await db.put(storeName, item)
}

export async function deleteItem(storeName: string, id: string | number): Promise<void> {
  const db = await initDB()
  await db.delete(storeName, id)
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await initDB()
  await db.clear(storeName)
}