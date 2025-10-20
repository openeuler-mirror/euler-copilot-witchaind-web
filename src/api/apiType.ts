export interface CreateKbRequest {
  // 基本设置
  kbName: string;
  description: string;
  // 解析设置
  defaultParseMethod: string;
  chunkMethod: string; // semantic | mark
  chunkIdentifier: string; // 分块标识符
  defaultChunkSize: number;
  uploadCountLimit: number;
  // 向量化设置
  embeddingModel: string;
  tokenizer: string;
  // 检索设置
  enableReranker: boolean;
  rerankerModel: string;
  rerankMethod?: string; // 后端需要的reranker方法字段
  rerankName?: string; // 后端需要的reranker名称字段
  enableCompression: boolean;
  enableDocumentCategory: boolean;
  enableContextAssociation: boolean;
  // 其他
  docTypes: any[];
  [property: string]: any;
}

export interface UpdateKbRequest {
  // 基本设置
  kbName: string;
  description: string;
  // 解析设置
  defaultParseMethod: string;
  chunkMethod: string; // semantic | mark
  chunkIdentifier: string; // 分块标识符
  defaultChunkSize: number;
  uploadCountLimit: number;
  // 向量化设置
  embeddingModel: string;
  tokenizer: string;
  // 检索设置
  enableReranker: boolean;
  rerankerModel: string;
  rerankMethod?: string; // 后端需要的reranker方法字段
  rerankName?: string; // 后端需要的reranker名称字段
  enableCompression: boolean;
  enableDocumentCategory: boolean;
  enableContextAssociation: boolean;
  // 其他
  docTypes: object[];
  teamId?: string;
  [property: string]: any;
}

export interface QueryKbRequest {
  created_time_order?: string;
  document_count_order?: string;
  name?: string;
  page: number;
  pageSize: number;
  [property: string]: any;
}

export interface DocListRequest {
  chunk_size_order?: string;
  created_time_order?: string;
  document_type?: string;
  kbId: string;
  name?: string;
  page: number;
  pageSize: number;
  parse_status?: string;
  [property: string]: any;
}

export interface DocRenameRequest {
  chunkSize?: number;
  docTypeId?: string;
  docId?: string;
  docName?: string;
  [property: string]: any;
}

export interface DocDownload {
  id: string;
  name: string;
}

export interface ChunkRequest {
  docId: string;
  page: number;
  pageSize: number;
  text?: string;
  type?: string;
  [property: string]: any;
}
