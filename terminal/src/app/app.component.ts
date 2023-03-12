import {Component, OnInit} from '@angular/core';
import EditorJS from "@editorjs/editorjs";
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Marker from '@editorjs/marker';
import {retrieve, Shell} from "./shell/shell";

// @ts-ignore
import Checklist from '@editorjs/checklist';
import {Cell} from "./cell";


@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  editor: EditorJS | null = null;

  ngOnInit() {
    this.editor = new EditorJS({
      holder: 'editor-js',
      autofocus: true,
      data: JSON.parse(retrieve("c") || '"{}"'),
      tools: {
        header: {
          class: Header,
          inlineToolbar: ['link']
        },
        list: {
          class: List,
          inlineToolbar: ['link', 'bold']
        },
        marker: {
          class: Marker
        },
        code: {
          class: Cell,
          config: {
            language: 'javascript'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        }
      }
    });
    this.editor.isReady.then(() => {
      const shell = new Shell(this.editor as EditorJS, window);
      shell.start();
    });
  }

}
