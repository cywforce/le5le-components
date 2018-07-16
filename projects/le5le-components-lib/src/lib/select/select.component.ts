import {
  Component,
  Input,
  forwardRef,
  ElementRef,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'ui-select',
  template: `
    <div class="ui-select input" [class.readonly]="readonly" [class.show-dropdown]="!readonly && showDropdown" (click)="onClick()">
      <div class="flex middle pl10 full" *ngIf="multi">
        <div class="flex wrap full">
          <ng-template ngFor let-item let-i="index" [ngForOf]="selectedItems">
            <div [class.selected]="multi">
              {{ options.name? item[options.name]: item }}
              <i *ngIf="!readonly" class="iconfont icon-delete ml5" (click)="onDel(item, i)"></i>
            </div>
          </ng-template>

          <input *ngIf="!value || !value.length" [(ngModel)]="inputValue" [placeholder]="placeholder"
            (keyup)="search$.next($event.target.value)" style="width: 100%;padding-left:0">

          <input #input *ngIf="value && value.length" [(ngModel)]="inputValue"
            style="padding:0;flex-grow:1;width:.1rem" (keyup.backspace)="onMultiDel()"
            (keyup)="search$.next($event.target.value)">
        </div>
        <i class="iconfont icon-triangle-down right" (click)="onClickMulti()"></i>
      </div>
      <div class="flex middle full" *ngIf="!multi">
        <input class="full pl10" [placeholder]="placeholder" [(ngModel)]="inputValue"
          (keyup)="search$.next($event.target.value)" (change)="onInputChange()"
          [readOnly]="readonly || inputReadonly"  (click)="onClickInput($event)">
        <i class="iconfont icon-triangle-down right" (click)="clickShowDropdown=-1;showDropdown=true"></i>
      </div>
      <div class="dropdown" [class.block]="showDropdown" *ngIf="!readonly">
        <div class="item" *ngIf="!multi && !options.autocomplete && !options.noDefaultOption"
          (click)="onSelect($event, null)">{{ placeholder || '请选择' }}</div>
        <div class="item" *ngIf="loading">
          <span class="iconfont icon-loading icon-spin"></span>
          Loading...
        </div>
        <ng-template ngFor let-item let-i="index" [ngForOf]="options.list">
          <div class="item flex middle" *ngIf="!multi || !isChecked(item)" (click)="onSelect($event, item)"
            [title]="item.tooltip || ''">
            <label class="full">{{ options.name? item[options.name]: item }}</label>
            <span class="iconfont icon-delete pointer" *ngIf="item.del" (click)="onDelOption($event, item, i)"></span>
          </div>
        </ng-template>
        <div class="item gray" *ngIf="!options.list || !options.list.length
          || (multi && value && options.list && value.length === options.list.length)">暂无下拉选项</div>
      </div>
    </div>
  `,
  // tslint:disable-next-line:use-host-property-decorator
  host: {
    '(document:click)': 'onClickDocument($event)'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  styleUrls: ['./select.css'],
  encapsulation: ViewEncapsulation.None
})
export class SelectComponent
  implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  // 下拉列表选项，list表示下拉列表数组，其中：id表示value的来源，name表示显示来源；当id或name为空时，表示list为字符串数组
  // autocomplete 表示自动完成；noDefaultOption 表示不要“请选择”
  @Input() options: any = { id: 'id', name: 'name', list: [] };

  // 是否多选
  @Input() multi = true;

  @Input() loading = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() placeholder = '';
  @Output() change = new EventEmitter<any>();
  @Output() autoChange = new EventEmitter<any>();

  @ViewChild('input') input: ElementRef;

  // ngModeld的实际值
  private _value: any;
  selectedItems: any[] = [];

  // 下拉选项显示控制
  clickShowDropdown = -1;
  showDropdown = false;

  // 单选显示数据
  inputValue: string;
  // 单选输入框只读属性
  inputReadonly = true;

  search$ = new Subject<string>();

  private valueChange = (value: any) => {};
  private touch = () => {};

  @Input()
  set dropdown(show: boolean) {
    if (this.clickShowDropdown < 0) {
      this.showDropdown = false;
      this.clickShowDropdown = 0;
      return;
    }

    this.clickShowDropdown = 1;
    this.showDropdown = !this.showDropdown;
  }

  constructor(private _elemRef: ElementRef) {}

  ngOnInit() {
    if (this.multi) {
      this._value = [];
      this.selectedItems = [];
    } else if (this.options.autocomplete) {
      this.inputReadonly = false;
    }

    if (!this.placeholder) {
      this.placeholder = this.multi ? '请选择 [可多选]' : '请选择';
    }

    this.search$
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(text => {
        this.autoChange.emit(text);
      });
  }

  checkInputReadonly(item: any) {
    // 默认单选输入是只读的；自动完成模式或者input标识则可输入
    this.inputReadonly = !this.options.autocomplete;
    if (item && item.input) {
      this.inputReadonly = false;
    }
  }

  get value(): any {
    return this._value;
  }

  set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      if (!this.multi) {
        this.inputValue = this._value;

        if (this._value !== undefined && this.options.id && this.options.list) {
          let item: any;
          for (const i of this.options.list) {
            // tslint:disable-next-line:triple-equals
            if (i[this.options.id] == v) {
              item = i;
            }
          }
          if (item) {
            this.inputValue = this.options.name
              ? item[this.options.name]
              : item;
          }
        }
      } else if (v && v.length && this.options.id && this.options.list) {
        for (const id of v) {
          for (const item of this.options.list) {
            // tslint:disable-next-line:triple-equals
            if (item[this.options.id] == id) {
              this.selectedItems.push(item);
            }
          }
        }
      }
    }
  }

  // 实现Validator接口，验证有效性
  validate(c: AbstractControl): { [key: string]: any } {
    if (!this.required) {
      return;
    }

    if (!this._value || (this.multi && this._value.length === 0)) {
      return { required: true };
    }
  }

  // model -> view
  writeValue(value: any) {
    this.value = value;

    if (!this.multi && value && this.options.list) {
      for (const item of this.options.list) {
        if (this.options.id) {
          if (value === item[this.options.id]) {
            this.checkInputReadonly(item);
          }
        } else if (value === item) {
          this.checkInputReadonly(item);
        }
      }
    }
  }

  // view -> model，当控件change后，调用的函数通知改变model
  registerOnChange(fn: any) {
    this.valueChange = fn;
  }

  // 通知touched调用的函数
  registerOnTouched(fn: any) {
    this.touch = fn;
  }

  onSelect(event: any, item: any) {
    if (event) {
      event.stopPropagation();
    }

    this.showDropdown = false;

    if (this.multi) {
      if (!this._value) {
        this._value = [];
      }
      if (this.options.id) {
        this._value.push(item[this.options.id]);
      } else {
        this._value.push(item);
      }
      this.selectedItems.push(item);
    } else {
      if (item) {
        this._value = this.options.id ? item[this.options.id] : item;
      } else {
        this._value = '';
      }

      if (
        item &&
        (this._value !== undefined ||
          this._value !== null ||
          this._value !== '')
      ) {
        this.inputValue = this.options.name ? item[this.options.name] : item;
      } else {
        this.inputValue = '';
      }

      this.checkInputReadonly(item);
    }
    this.valueChange(this._value);
    this.touch();
    this.change.emit(this._value);
  }

  onInputChange() {
    if (this.options.onlySelect) {
      return;
    }

    this.value = this.inputValue;
    this.valueChange(this.inputValue);
    this.change.emit(this.inputValue);
  }

  onDel(item: any, index: number) {
    for (let i = 0; i < this._value.length; ++i) {
      if (this.options.id) {
        if (this._value[i] === item[this.options.id]) {
          this._value.splice(i, 1);
        }
      } else if (this._value[i] === item) {
        this._value.splice(i, 1);
      }
    }

    this.selectedItems.splice(index, 1);
    this.valueChange(this._value);
    this.change.emit(this._value);
  }

  onClick() {
    if (this.multi || this.inputReadonly) {
      this.showDropdown = true;
    }
  }

  onClickInput(event: any) {
    this.clickShowDropdown = -1;
    if (
      (this.options.autocomplete && this.options.list.length) ||
      this.inputReadonly
    ) {
      this.showDropdown = true;
    }
  }

  onClickDocument(event) {
    if (!this._elemRef.nativeElement.contains(event.target)) {
      if (this.clickShowDropdown !== 1) {
        this.showDropdown = false;
      }
      this.clickShowDropdown = 0;
    }
  }

  onClickMulti() {
    if (this.input) {
      this.input.nativeElement.focus();
    }
  }

  onMultiDel() {
    if (!this._value || !this._value.length) {
      return;
    }

    this._value.pop();
    this.selectedItems.pop();
    this.valueChange(this._value);
    this.change.emit(this._value);
  }

  isChecked(item: any) {
    if (!this.multi) {
      if (this.options.list && this.options.list.length < 2) {
        return false;
      }

      if (this.options.id) {
        return this._value === item[this.options.id];
      } else {
        return this._value === item;
      }
    }

    if (!this._value || !this._value.length) {
      return false;
    }
    for (const v of this._value) {
      if (this.options.id) {
        if (v === item[this.options.id]) {
          return true;
        }
      } else if (v === item) {
        return true;
      }
    }
  }

  onDelOption(event: any, item: any, i: number) {
    event.stopPropagation();
    if (this.options.delOption) {
      this.options.delOption(item, i);
    }
  }

  ngOnDestroy() {
    if (this.search$) {
      this.search$.unsubscribe();
    }
  }
}
