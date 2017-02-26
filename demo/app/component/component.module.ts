import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import {FormsModule} from "@angular/forms";

import {componentRouting} from "./component.routing";
import {ComponentComponent} from "./component.component";
import {ComponentNoticeComponent} from "./notice/notice.component";
import {ComponentLazyLoadComponent} from "./lazyLoad/lazyLoad.component";
import {ComponentCookieComponent} from "./cookie/cookie.component";
import {ComponentEllipsisComponent} from "./ellipsis/ellipsis.component";
import {ComponentSwitchComponent} from "./switch/switch.component";
import {ComponentQrcodeComponent} from "./qrcode/qrcode.component";
import {ComponentValidatorComponent} from "./validator/validator.component";
import {ComponentFileUploadComponent} from "./fileUpload/fileUpload.component";
import {ComponentEditorComponent} from "./editor/editor.component";

import {
  ImageLazyLoad, QRCodeComponent, SwitchComponent, FileUploadComponent, EditorComponent,
  PasswordValidator, PhoneValidator, PositiveIntegerValidator, SameValidator, EmailValidator,
  FileSelectDirective,
  EllipsisPipe,
  CookieService } from '../../../index'

@NgModule({
  imports:       [FormsModule, CommonModule, componentRouting],
  declarations: [
    ComponentComponent,
    ComponentNoticeComponent,
    ComponentLazyLoadComponent,
    ImageLazyLoad,
    ComponentCookieComponent,
    EllipsisPipe,
    ComponentEllipsisComponent,
    ComponentSwitchComponent,
    SwitchComponent,
    ComponentQrcodeComponent,
    QRCodeComponent,
    ComponentValidatorComponent,
    PhoneValidator,
    PasswordValidator,
    PositiveIntegerValidator,
    SameValidator ,
    EmailValidator,
    ComponentFileUploadComponent,
    FileSelectDirective,
    FileUploadComponent,
    ComponentEditorComponent,
    EditorComponent,
  ]
})
export class ComponentModule { }
