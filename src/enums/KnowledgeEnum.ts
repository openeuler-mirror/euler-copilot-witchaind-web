/**
 * 状态枚举
 */
export const enum StatusEnum {
  FAIL = 'failed',
  CANCEL = 'canceled',
  ANALYSIS_ING = 'pending',
  SUCCESS = 'success',
  RUNNING = 'running',
}

export const enum DataSetStatusEnum {
 PENDING = 'pending',
RUNNING = 'running',
SUCCESS ='success',
FAILED = 'failed',
CANCELED = 'canceled',
 DELETED ='deleted'
}

export const enum MenuType {
  KL_FILE = 'klFile',
  KL_CONFIG = 'klConfig',
}
