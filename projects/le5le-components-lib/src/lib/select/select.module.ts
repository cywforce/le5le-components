import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SelectComponent } from './select.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SelectComponent],
  exports: [SelectComponent]
})
export class SelectModule {}
