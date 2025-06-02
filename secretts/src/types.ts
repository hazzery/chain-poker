interface UploadData {
  codeId: string;
  contractCodeHash: string;
}

interface InstantiateData {
  contractCodeHash: string;
  contractAddress: string;
}

export type { UploadData, InstantiateData };
