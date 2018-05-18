import {
  OnInit,
  OnDestroy,
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[uiDivMove]'
})
export class DivMoveDirective implements OnInit, OnDestroy {
  @Input() divMove = true;
  @Input() isHead = false;
  @Input() pos: any;
  @Output() move = new EventEmitter<any>();
  nativeElement: any;
  mouseDown$: any;
  mouseMove$: any;
  mouseUp$: any;
  sub$: any;
  constructor(private element: ElementRef) {}

  ngOnInit() {
    this.nativeElement = this.element.nativeElement;
    if (this.isHead) {
      this.nativeElement = this.nativeElement.parentElement;
    }

    this.mouseDown$ = fromEvent(this.element.nativeElement, 'mousedown');
    this.mouseMove$ = fromEvent(document, 'mousemove');
    this.mouseUp$ = fromEvent(document, 'mouseup');

    this.sub$ = this.mouseDown$
      .pipe(
        map(event => ({
          pos: this.getPos(this.nativeElement),
          event
        })),
        switchMap((initialState: any) => {
          const initialPos = initialState.pos;
          const { clientX, clientY } = initialState.event;
          return this.mouseMove$.pipe(
            map((moveEvent: any) => ({
              x: moveEvent.clientX - clientX + initialPos.x,
              y: moveEvent.clientY - clientY + initialPos.y
            })),
            takeUntil(this.mouseUp$)
          );
        })
      )
      .subscribe(pos => {
        this.setPos(this.nativeElement, pos);
      });
  }

  getPos(nativeElement: any): any {
    const style = getComputedStyle(nativeElement);
    const regExp = /matrix\((\d+,\s){4}([-]*\d+),\s([-]*\d+)/i;
    const result = style.transform.match(regExp);
    if (result) {
      return {
        x: parseInt(result[2], 10),
        y: parseInt(result[3], 10)
      };
    } else {
      return {
        x: 0,
        y: 0
      };
    }
  }

  setPos(nativeElement: any, pos: any) {
    if (this.move) {
      this.move.emit(Object.assign({}, pos));
    }
    if (!this.pos) {
      nativeElement.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    } else {
      nativeElement.style.left = this.pos.x + pos.x + 'px';
      nativeElement.style.top = this.pos.y + pos.y + 'px';
    }
  }

  ngOnDestroy() {
    if (this.sub$) {
      this.sub$.unsubscribe();
    }
  }
}
