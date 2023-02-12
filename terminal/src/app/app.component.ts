import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {NgTerminal} from "ng-terminal";
// @ts-ignore
import LocalEchoController from 'local-echo';
import {Sandbox} from "./sandbox";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('term', {static: false}) child?: NgTerminal;
  baseTheme = {
    foreground: '#EBDBB2',
    background: '#000000',
    selectionBackground: '#282828',
    black: '#1E1E1D',
    brightBlack: '#262625',
    red: '#CE5C5C',
    brightRed: '#FF7272',
    green: '#5BCC5B',
    brightGreen: '#72FF72',
    yellow: '#CCCC5B',
    brightYellow: '#FFFF72',
    blue: '#5D5DD3',
    brightBlue: '#7279FF',
    magenta: '#BC5ED1',
    brightMagenta: '#E572FF',
    cyan: '#5DA5D5',
    brightCyan: '#72F0FF',
    white: '#F8F8F8',
    brightWhite: '#FFFFFF'
  };

  ngAfterViewInit() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    this.child?.setCols(Math.floor(vw / 9 - 2));
    this.child?.setRows(Math.floor(vh / 15));
    this.child?.setXtermOptions({
      fontFamily: '"IBM Plex Mono", Menlo, monospace',
      theme: this.baseTheme,
      cursorBlink: true,
      cursorStyle: 'underline',
      logLevel: "off"
    });
    const localEcho = new LocalEchoController();
    this.child?.underlying.loadAddon(localEcho);
    const sandbox = new Sandbox(localEcho, this.child?.underlying);
    localEcho.println("EvaSim");
    localEcho.println(`Type "help" for all available commands. EvaSim sandbox supports JavaScript.`);
    const read_and_eval_loop = () => localEcho.read("$ ")
      .then((input: any) => {
        sandbox.exec(input);
        return read_and_eval_loop();
      })
      .catch((error: any) => {
        localEcho.println(`Error reading: ${error}`);
        return read_and_eval_loop();
      });
    read_and_eval_loop();
  }

}