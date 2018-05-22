import {
  OnInit,
  OnDestroy,
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';

import { Terminal } from 'xterm';
import { fit } from 'xterm/lib/addons/fit/fit';
import { attach, detach } from 'xterm/lib/addons/attach/attach';

@Component({
  selector: 'ui-xterm',
  template: `<div class="ui-xterm" #terminal></div>`,
  styleUrls: ['./xterm.css'],
  encapsulation: ViewEncapsulation.None
})
export class XTermComponent implements OnInit, OnDestroy {
  @Input() socketUrl: string;
  @Input() options: any = {};

  @ViewChild('terminal') terminalHost: ElementRef;
  private xterm: Terminal;
  private socket: WebSocket;
  wsSuccess: boolean;
  constructor() {}

  @Input()
  public set winStatus(v: any) {
    this.onResize();
  }

  onResize() {
    if (!this.xterm) {
      return;
    }

    setTimeout(() => {
      fit(this.xterm);
    }, 100);
    setTimeout(() => {
      fit(this.xterm);
    }, 500);
  }

  ngOnInit() {
    this.xterm = new Terminal();
    this.xterm.open(this.terminalHost.nativeElement);
    this.xterm.focus();
    this.onResize();

    this.options.xterm = this.xterm;

    this.socket = new WebSocket(this.socketUrl);
    this.socket.onopen = this.attachTerminal;
  }

  focus() {
    setTimeout(() => {
      this.xterm.focus();
    }, 300);
  }

  attachTerminal = () => {
    attach(this.xterm, this.socket, true, false);
    this.onResize();
    this.focus();

    this.xterm.attachCustomKeyEventHandler(e => {
      if (e.ctrlKey) {
        // Ctrl  + C
        if (e.keyCode === 67 && this.xterm.hasSelection()) {
          document.execCommand('copy');
          return false;
        } else if (e.keyCode === 86) {
          // Ctrl  + V
          document.execCommand('paste');
          return false;
        }
      }
    });
  };

  ngOnDestroy() {
    if (this.socket) {
      detach(this.xterm, this.socket);
      this.socket.close();
    }
  }
}
