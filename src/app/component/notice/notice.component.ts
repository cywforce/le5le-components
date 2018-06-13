import { Component } from '@angular/core';
import { NoticeService } from 'projects/le5le-components-lib/src/lib';

@Component({
  selector: 'app-component-notice',
  templateUrl: 'notice.component.html',
  providers: [],
  styleUrls: ['./notice.component.scss']
})
export class ComponentNoticeComponent {
  constructor() {}

  onMsgDefault() {
    const _noticeService: NoticeService = new NoticeService();
    _noticeService.notice({ body: 'default!', timeout: 200000000 });
  }
  onMsgSuccess() {
    const _noticeService: NoticeService = new NoticeService();
    _noticeService.notice({
      theme: 'success',
      body: 'success!',
      timeout: 200000000
    });
  }
  onMsgWarning() {
    const _noticeService: NoticeService = new NoticeService();
    _noticeService.notice({
      theme: 'warning',
      body: 'warning!',
      timeout: 200000000
    });
  }
  onMsgError() {
    const _noticeService: NoticeService = new NoticeService();
    _noticeService.notice({
      theme: 'error',
      body: 'error!',
      timeout: 200000000
    });
  }
  onMsgDialog() {
    const _noticeService: NoticeService = new NoticeService();
    _noticeService.dialog({
      title: '关于',
      body: '乐吾乐 - angular UI 组件库',
      noCancel: true
    });
  }
  onMsgInput() {
    const _noticeService: NoticeService = new NoticeService();
    _noticeService.input({
      title: '名称',
      label: 'hello',
      theme: 'default',
      text: '',
      placeholder: '请输入名称',
      required: true,
      type: 'text',
      callback: (ret: string) => {
        _noticeService.dialog({
          title: '你刚才的输入',
          body: ret,
          noCancel: true
        });
      }
    });
  }
}