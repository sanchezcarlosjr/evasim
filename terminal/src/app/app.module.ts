import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgTerminalModule } from 'ng-terminal';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgTerminalModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
