/**
 * Object-storage adapter seam. Sprint 0 defines the interface only.
 * Implementations must scope keys by workspaceId.
 */
export type StorageObjectRef = {
  workspaceId: string;
  key: string;
  contentType?: string;
};

export interface StorageProvider {
  upload(
    ref: StorageObjectRef,
    body: Uint8Array | ReadableStream,
    contentType: string,
  ): Promise<{ key: string }>;
  getSignedReadUrl(
    ref: StorageObjectRef,
    expiresInSeconds: number,
  ): Promise<{ url: string; expiresAt: string }>;
  delete(ref: StorageObjectRef): Promise<void>;
  getMetadata(
    ref: StorageObjectRef,
  ): Promise<{ contentType: string; size: number } | null>;
}
