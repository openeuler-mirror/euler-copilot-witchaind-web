import request from '@/utils/request';
import uploadRequest from '@/utils/uploadRequest';
import { ChunkRequest, DocListRequest, DocRenameRequest } from './apiType';

class KfAppAPI {
  /** 获取资产库里的文件*/
  static getKbLibraryFile(data: DocListRequest) {
    return request({
      url: `/doc/list`,
      method: 'post',
      data: data,
    });
  }
  /** 修改资产库里的文件*/
  static updateLibraryFile(params: { docId: string }, data: DocRenameRequest) {
    return request({
      url: `/doc`,
      method: 'put',
      params,
      data: data,
    });
  }

  /** 是否删除文件*/
  static delLibraryFile(data: string[]) {
    return request({
      url: `/doc`,
      method: 'delete',
      data: data,
    });
  }

  /** 是否重启/取消文件*/
  static runLibraryFile(params: { parse: boolean }, data: string[]) {
    return request({
      url: `/doc/parse`,
      method: 'post',
      params,
      data,
    });
  }

  /**导入资产库文档 */
  static importKbLibraryFile(payload: { data: any; params: any }, options: any) {
    // 支持请求取消
    const abortController = options.abortController || new AbortController();
    
    return uploadRequest({
      url: `/doc`,
      method: 'post',
      params: payload.params,
      data: payload.data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: abortController.signal, // ✓ 支持取消请求
      onUploadProgress(e) {
        const rate = Math.floor((e.loaded / (e.total as number)) * 100);
        if (rate < 100) {
          options.onProgress(rate);
        }
      },
    });
  }

  /** 下载文件*/
  static downloadLibraryFile(data: { ids: string[] }) {
    return request({
      url: `/doc/download`,
      method: 'post',
      data: data,
    });
  }

  /** 获取导入知识库状态*/
  static queryKfTaskList(data: { type: string }) {
    return request({
      url: `/doc/task/list`,
      method: 'post',
      data: data,
    });
  }

  static stopKfTaskList(data: { id: string }) {
    return request({
      url: `/doc/task/stop`,
      method: 'post',
      data: data,
    });
  }

  /** 查询文档预览内容*/
  static chunkLibraryFile(data: ChunkRequest) {
    return request({
      url: `/chunk/list`,
      method: 'post',
      data: data,
    });
  }

  /**  更新文本块内容 */
  static updateFileSection(
    params: { chunkId: string },
    data: { enabled?: boolean; text?: string }
  ) {
    return request({
      url: `/chunk`,
      method: 'put',
      params,
      data: data,
    });
  }

  /**  批量启用文本块内容 */
  static switchFileSection(params: { enabled: boolean }, data: string[]) {
    return request({
      url: `/chunk/switch`,
      method: 'put',
      params,
      data: data,
    });
  }

  /** 查询文档日志*/
  static getDocumentLog(data: { docId: string }) {
    return request({
      url: `/doc/report`,
      method: 'get',
      params: data,
    });
  }

  /* 测试上传速度 */
  static importSpeedTest( data: { file: File } ) {
    return request({
      url: `/doc/speed-test`,
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default KfAppAPI;
