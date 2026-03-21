type NormalizePackageUploadPathOptions = {
  stripTopLevelFolder?: boolean;
};

type UploadablePackageFile = {
  name: string;
  size: number;
  type: string;
  webkitRelativePath?: string;
};

export function normalizePackageUploadPath(
  path: string,
  options: NormalizePackageUploadPathOptions = {},
) {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return "";
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  if (!options.stripTopLevelFolder) return parts.join("/");
  return parts.slice(1).join("/") || (parts.at(-1) ?? "");
}

export async function buildPackageUploadEntries<TFile extends UploadablePackageFile>(
  files: TFile[],
  options: {
    generateUploadUrl: () => Promise<string>;
    hashFile: (file: TFile) => Promise<string>;
    uploadFile: (uploadUrl: string, file: TFile) => Promise<string>;
  },
) {
  const uploaded: Array<{
    path: string;
    size: number;
    storageId: string;
    sha256: string;
    contentType?: string;
  }> = [];

  for (const file of files) {
    const sha256 = await options.hashFile(file);
    const uploadUrl = await options.generateUploadUrl();
    const storageId = await options.uploadFile(uploadUrl, file);
    const relativePath = file.webkitRelativePath?.trim() || "";
    const rawPath = relativePath || file.name;
    const path =
      normalizePackageUploadPath(rawPath, {
        stripTopLevelFolder: Boolean(relativePath),
      }) || file.name;
    uploaded.push({
      path,
      size: file.size,
      storageId,
      sha256,
      contentType: file.type || undefined,
    });
  }

  return uploaded;
}
