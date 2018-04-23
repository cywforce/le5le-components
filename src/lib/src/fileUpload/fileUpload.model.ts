export enum FileStatus {
  Ready,
  Uploading,
  Success,
  Fail,
  Cancel
}

export class FileItem {
  id: string;
  status: FileStatus = FileStatus.Ready;
  error: string = '';
  progress: number = 0;
  // 上传服务器前为base64图片预览数据，上传后为服务器返回的文件访问url
  url: any;
  constructor(public file: File) {}
}

export class UploadParam {
  field: string = 'file';
  headers: any = {};
  maxCount: number = 1;
  maxLength: number = 2 * 1024 * 1024;
  progress: number = 0;
  withCredentials: boolean;
  autoUpload: boolean;
  constructor(public url: string, headers?: any, autoUpload?: boolean) {
    if (headers) this.headers = headers;
    if (autoUpload) this.autoUpload = autoUpload;
  }
}
