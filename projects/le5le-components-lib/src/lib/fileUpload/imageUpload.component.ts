import {
  OnInit,
  OnChanges,
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  SimpleChange
} from '@angular/core';

import { FileUploader } from './fileUploader';
import { NoticeService } from '../notice/notice.service';
import { UploadParam, FileItem, FileStatus } from './fileUpload.model';

@Component({
  selector: 'ui-image-upload',
  template: `
    <div *ngIf="!options.onlyUpload">
      <div *ngFor="let item of _fileItems; let i = index" class="ui-image-upload" >
        <img [src]="options.cdn + item.url" />
        <div class="bk"> <i class="iconfont icon-close" (click)="del(i)"></i> </div>
        <div *ngIf="item.status == 1 && item.progress < 100" class="tip line one" >{{item.progress}}</div>
        <div *ngIf="item.error" class="tip error line one" [title]="item.error">错误：{{item.error}}</div>
      </div>
    </div>
    <div class="ui-image-upload box dash" *ngIf="_fileItems.length < options.maxCount || options.onlyUpload">
      <div class="content">
        <i class="iconfont icon-add font-2x"></i>
        <div class="desc">点击上传图片</div>
      </div>
      <input type="file" (change)="onFileChange($event)" [accept]="options.accept" [multiple]="options.maxCount>1" />
    </div>
  `,
  styleUrls: ['./fileUpload.css'],
  encapsulation: ViewEncapsulation.None
})
export class ImageUploadComponent implements OnInit, OnChanges {
  @Input()
  urls: string[] = [];
  @Output()
  urlsChange = new EventEmitter<any>();
  @Input()
  files: any[] = [];
  @Output()
  filesChange = new EventEmitter<any>();
  @Input()
  options: any = {};
  @Input()
  reset = false;
  _fileItems: FileItem[] = [];
  uploader: FileUploader;
  constructor(private _noticeService: NoticeService) {}

  ngOnInit() {
    if (!this.options.maxCount) {
      this.options.maxCount = 1;
    }
    if (!this.options.accept) {
      this.options.accept = 'image/gif, image/jpeg, image/png, image/svg';
    }
    if (!this.options.cdn) {
      this.options.cdn = '';
    }
    const params: UploadParam = new UploadParam(
      <string>this.options.url,
      this.options.headers,
      <boolean>this.options.autoUpload
    );
    if (this.options.accept.indexOf('image/') > -1) {
      params.exts = 'png,bmp,jpeg,jpg,gif,svg';
    }
    if (this.options.maxLength) {
      params.maxLength = this.options.maxLength;
    }
    this.uploader = new FileUploader(params);

    for (const item of this.urls) {
      const fileItem: FileItem = new FileItem(null);
      fileItem.status = FileStatus.Success;
      fileItem.id = item;
      fileItem.url = item;
      this._fileItems.push(fileItem);
    }

    this.uploader.emitter.subscribe(ret => {
      if (ret.event === 'error') {
        this._noticeService.notice({
          theme: 'error',
          body: ret.fileItem.error
        });
        this.getFiles();
      } else if (ret.event === 'ready') {
        if (this.options.maxCount === 1) {
          this._fileItems = [];
        }
        this._fileItems.push(ret.fileItem);
        this.getFiles();
      } else if (ret.event === 'progress') {
        for (const item of this._fileItems) {
          if (item.id === ret.fileItem.id) {
            item.status = FileStatus.Uploading;
            item.progress = ret.fileItem.progress;
          }
        }
      } else if (ret.event === 'complete') {
        if (ret.fileItem.status !== FileStatus.Success) {
          return;
        }

        for (const item of this._fileItems) {
          if (item.id === ret.fileItem.id) {
            item.status = FileStatus.Success;
            if (this.options.absolute) {
              item.url = this.options.cdn + ret.fileItem.url;
            } else {
              item.url = ret.fileItem.url;
            }
          }
        }
      } else if (ret.event === 'completeAll') {
        this.uploader.fileList = [];
        this.getUrls();
      }
    });
  }

  getFiles() {
    this.files = [];
    for (const item of this._fileItems) {
      if (item.file) {
        this.files.push(item.file);
      }
    }
    this.filesChange.emit(this.files);
  }

  getUrls() {
    this.urls = [];
    for (const item of this._fileItems) {
      if (!item.url) {
        continue;
      }
      this.urls.push(item.url);
    }
    this.urlsChange.emit(this.urls);
  }

  onFileChange(event: any) {
    const elem: any = event.srcElement || event.target;
    this.uploader.addFiles(elem.files);
  }

  del(index: number) {
    this._fileItems.splice(index, 1);
    this.getFiles();
    this.getUrls();
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    if (changes['reset']) {
      this._fileItems = [];
      this.files = [];
      this.urls = [];
    }
    if (changes['urls']) {
      for (const item of this.urls) {
        const fileItem: FileItem = new FileItem(null);
        fileItem.status = FileStatus.Success;
        fileItem.id = item;
        fileItem.url = item;
        if (this.options.maxCount === 1) {
          this._fileItems = [];
        }
        this._fileItems.push(fileItem);
      }
    }
  }
}
