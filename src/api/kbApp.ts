import request from '@/utils/request';
import { CreateKbRequest, QueryKbRequest, UpdateKbRequest } from './apiType';
import { ModelForm } from '@/components/UserHeaderBar/modelConfig';
import qs from 'qs';

export type ITaskType =
  | 'doc_parse'
  | 'kb_export'
  | 'kb_import'
  | 'dataset_export'
  | 'dataset_import'
  | 'dataset_generate'
  | 'tetsing_run';
class KbAppAPI {
  /** 获取用户所有知识库*/
  static getKbLibrary(data: QueryKbRequest) {
    return request({
      url: `/kb/team`,
      method: 'post',
      data: data,
    });
  }

  /** 删除用户知识库*/
  static delKbLibrary(data: string[]) {
    return request({
      url: `/kb`,
      method: 'delete',
      data: data,
    });
  }

  /** 创建用户知识库*/
  static createKbLibrary(params: { teamId: string }, data: CreateKbRequest) {
    return request({
      url: `/kb`,
      method: 'post',
      data: data,
      params,
    });
  }

  /**更新资产库 */
  static updateKbLibrary(params: { kbId: string }, data: UpdateKbRequest) {
    return request({
      url: `/kb`,
      method: 'put',
      data: data,
      params,
    });
  }

  /** 获取导入/导出任务列表*/
  static queryTaskList(data: {
    teamId: string;
    taskType: ITaskType;
    pageSize: number;
    page: number;
  }) {
    return request({
      url: `/task`,
      method: 'post',
      data: data,
    });
  }

  static stopKbTaskList(params: { taskId?: string; taskType?: ITaskType }, data: string[]) {
    return request({
      url: `/task`,
      method: 'delete',
      params,
      data: data,
    });
  }

  /** 删除任务列表一条任务 */
  static stopOneTaskList(params: { taskId: string }) {
    return request({
      url: `/task/one`,
      method: 'delete',
      params,
    });
  }
  /** 删除任务列表所有任务 */
  static stopAllTaskList(params: { teamId: string; taskType: ITaskType }) {
    return request({
      url: `/task/all`,
      method: 'delete',
      params,
    });
  }

  /**导入资产库 */
  static importKbLibrary(payload: { data: any; params: any }, options: any) {
    return request({
      url: `/kb/import`,
      method: 'post',
      data: payload.data,
      params: payload.params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress(e) {
        const rate = Math.floor((e.loaded / (e.total as number)) * 100);
        if (rate < 100) {
          options.onProgress(rate);
        }
      },
    });
  }

  /**打包资产库 */

  static savebLibrary(kbIds: string[], options: any) {
    return request({
      url: `/kb/export`,
      params: {
        kbIds,
      },
      paramsSerializer: (params) => qs.stringify(params, { indices: false }),
      method: 'post',
      onUploadProgress(e) {
        const rate = Math.floor((e.loaded / (e.total as number)) * 100);
        if (rate < 100) {
          options.onProgress(rate);
        }
      },
    });
  }

  /**导出资产库 */
  static exportbLibrary(fileId: string) {
    return request({
      url: `/kb/download`,
      data: {
        id: fileId,
      },
      method: 'post',
    });
  }

  static queryLanguageList() {
    return request({
      url: `/other/tokenizer`,
      method: 'get',
    });
  }

  static queryEmbeddingModelList() {
    return request({
      url: `/other/embedding`,
      method: 'get',
    });
  }

  static queryParseMethodList() {
    return request({
      url: `/other/parse_method`,
      method: 'get',
    });
  }

  static querySearchMethodList() {
    return request({
      url: `/other/search_method`,
      method: 'get',
    });
  }

  /** 获取Reranker模型列表 */
  static queryRerankerList() {
    return request({
      url: `/other/rerank`,
      method: 'get',
    });
  }

  /** 是否启用文件*/
  static addUserModel(data: ModelForm) {
    return request({
      url: `/model/update`,
      method: 'post',
      data: data,
    });
  }

  static getdUserModel() {
    return request({
      url: `/model/get`,
      method: 'get',
    });
  }

  static localModelList() {
    return request({
      url: `/model/list`,
      method: 'get',
    });
  }
}

export default KbAppAPI;
