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
  ViewEncapsulation,
  HostListener
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
  templateUrl: 'select.component.html',
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
  // autocomplete 表示自动完成；noDefaultOption 表示不要“请选择”；custom 表示允许用户输入内容作为value
  // 当autocomplete时，noAutocompleteList 表示不需要自动处理下拉选项。比如从网络读取。
  // options.more - 显示  更多...
  @Input()
  options: any = { id: 'id', name: 'name', list: [] };

  // 是否多选
  @Input()
  multi = true;

  @Input()
  loading = false;
  @Input()
  readonly = false;
  @Input()
  required = false;
  @Input()
  placeholder = '';

  // tslint:disable-next-line:no-output-native
  @Output() change = new EventEmitter<any>();
  @Output() autoChange = new EventEmitter<any>();
  @Output() more = new EventEmitter<any>();

  @ViewChild('input', { static: false })
  input: ElementRef;

  // ngModeld的实际值
  // tslint:disable-next-line:variable-name
  _value: any;

  // 多选值
  selectedItems: any[] = [];

  // 下来选项备份，搜索用
  list: any[] = [];

  // 下拉选项显示控制
  alwaysDropdown = false;
  showDropdown = false;

  // 单选显示数据
  lastInputValue: string;
  inputValue: string;
  // 单选输入框只读属性
  inputReadonly = true;

  search$ = new Subject<string>();

  private valueChange = (value: any) => { };
  private touch = () => { };

  @Input()
  set dropdown(show: boolean) {
    this.alwaysDropdown = show;
    this.showDropdown = show;
  }

  constructor(private elemRef: ElementRef) { }

  ngOnInit() {
    if (this.multi) {
      this._value = [];
      this.selectedItems = [];
    } else if (this.options.autocomplete) {
      this.inputReadonly = false;
    }

    this.list = this.options.list || [];

    if (!this.placeholder) {
      this.placeholder = this.multi ? '请选择 [可多选]' : '请选择';
    }

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(text => {
        this.showDropdown = true;
        if (
          this.options.name &&
          this.options.autocomplete &&
          !this.options.noAutocompleteList
        ) {
          this.options.list = [];
          let found: any = null;
          for (const item of this.list) {
            if (item[this.options.name].indexOf(text) > -1) {
              this.options.list.push(item);
            }

            if (item[this.options.name] === text) {
              found = item;
            }
          }

          if (found) {
            this.onSelect(null, found);
          } else if (this.options.custom) {
            this.onSelect(null, text);
          }
        }
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
        this.selectedItems = [];
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
  validate(c: AbstractControl): { [key: string]: any; } {
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
      this.inputValue = '';
    } else {
      if (item) {
        this._value =
          this.options.id && item[this.options.id] !== undefined
            ? item[this.options.id]
            : item;
      } else {
        this._value = '';
      }
      if (item && this._value !== undefined) {
        this.inputValue =
          this.options.name && item[this.options.name] !== undefined
            ? item[this.options.name]
            : item;
      } else {
        this.inputValue = '';
      }

      this.checkInputReadonly(item);
    }
    this.valueChange(this._value);
    this.touch();

    this.change.emit(item);
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
  }

  onClick() {
    if (this.multi || this.inputReadonly) {
      this.setDropdown();
    }
  }

  onClickInput(event: any) {
    if (
      (this.options.autocomplete && this.options.list) ||
      this.inputReadonly
    ) {
      this.setDropdown();
    }
  }

  setDropdown() {
    if (!this.multi && this.options.list) {
      let pos = 0;
      let i = 0;
      for (const item of this.options.list) {
        if (
          this._value !== undefined &&
          this._value === item[this.options.id]
        ) {
          item.active = true;
          pos = i;
        } else {
          item.active = false;
        }
        i++;
      }
      const scrollElem =
        this.elemRef.nativeElement.querySelector('.dropdown') ||
        this.elemRef.nativeElement.querySelector('.dropdown-list');
      if (scrollElem) {
        scrollElem.scrollTop = pos * 28;
      }
    }
    this.showDropdown = true;
  }

  @HostListener('document:click', ['$event', '$event.target'])
  onClickDocument(event: MouseEvent, targetElement: HTMLElement) {
    if (!this.elemRef.nativeElement.contains(event.target) && targetElement.getAttribute('data-id') !== 'ui-select-input') {
      if (this.options.autocomplete && !this.options.noAutocompleteList) {
        this.options.list = this.list;
      }

      if (!this.alwaysDropdown) {
        this.showDropdown = false;
      }
      if (this.multi || this._value === undefined || this._value === null) {
        this.inputValue = '';
      }
    }
  }

  onClickMulti() {
    if (this.input) {
      this.input.nativeElement.focus();
    }
  }

  onMultiDel() {
    if (this.lastInputValue || !this._value || !this._value.length) {
      return;
    }

    this._value.pop();
    this.selectedItems.pop();
    this.valueChange(this._value);
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

  onMore() {
    this.more.emit();
  }

  ngOnDestroy() {
    if (this.search$) {
      this.search$.unsubscribe();
    }
  }
}
