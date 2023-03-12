import {interval, map, Subscription} from "rxjs";
// @ts-ignore
import EditorjsCodeflask from '@calumk/editorjs-codeflask';

function shellListener(button: HTMLElement, cell: Cell, tune: {event: string}) {
  button.classList.toggle('cdx-settings-button--active');
  window.dispatchEvent(new CustomEvent(`${tune.event}`, {
    bubbles: true, detail: {
      payload: {
        // @ts-ignore
        code: cell.data.editorInstance.code,
        threadId: cell.id
      }
    }
  }));
}


export class Cell extends EditorjsCodeflask {
  readonly id: string = "";
  private cell: HTMLElement | undefined;
  private subscription: Subscription | undefined;

  constructor(obj: any) {
    super(obj);
    this.id = obj.block.id;
    // @ts-ignore
    this.readOnly = obj.data.readOnly;
    // @ts-ignore
    this.data.language = (obj.data.language === undefined) ? obj.config.language : obj.data.language;

    // @ts-ignore
    this.data.code = (obj.data.code === undefined) ? "" : obj.data.code;

    // @ts-ignore
    this.data.output = (obj.data.output === undefined) ? "" : obj.data.output;
  }

  save(obj: any) {
    return {
      ...super.save(obj),
      //@ts-ignore
      output: this.cell.children[2].innerHTML
    };
  }

  run() {
    const loader: string[] = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
    this.subscription = interval(400).pipe(map((time: number) => time % 12))
      // @ts-ignore
      .subscribe(index => this.cell.children[1].innerHTML = loader[index])
  }

  stop() {
    this.subscription?.unsubscribe();
    // @ts-ignore
    this.cell.children[1].innerHTML = "";
  }

  resetOutput() {
    //@ts-ignore
    this.cell.children[2].innerHTML = "";
  }

  write(text: string) {
    //@ts-ignore
    this.cell.children[2].innerHTML += text;
  }

  println(text: any) {
    this.write(text + "\n");
  }


  clear() {
    this.stop();
    this.resetOutput();
  }

  dispatchShellRun() {
    window.dispatchEvent(new CustomEvent('shell.Run', {
      bubbles: true, detail: {
        payload: {
          // @ts-ignore
          code: this.data.editorInstance.code,
          threadId: this.id
        }
      }
    }));
  }

  dispatchShellStop() {
    window.dispatchEvent(new CustomEvent('shell.Stop', {
      bubbles: true, detail: {
        payload: {
          threadId: this.id
        }
      }
    }));
  }

  render() {
    const element = super.render();
    this.cell = document.createElement('section');
    this.cell.classList.add('cell');
    const editor = document.createElement('section');
    editor.classList.add('editor');
    editor.appendChild(element);
    this.cell.appendChild(editor);
    this.cell.append(document.createElement('div'));
    this.cell.children[1].classList.add('progress');
    const output = document.createElement('pre');
    output.classList.add('output');
    this.cell.appendChild(output);
    //@ts-ignore
    output.innerHTML = this.data.output;

    element.addEventListener('keydown', (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "m" && keyboardEvent.ctrlKey && keyboardEvent.altKey) {
        keyboardEvent.preventDefault();
        this.dispatchShellRun();
      }
      if (keyboardEvent.key === "c" && keyboardEvent.ctrlKey) {
        this.dispatchShellStop();
      }
    }, false);
    return this.cell;
  }

  renderSettings() {
    const shellOptions: [{ listener: (button: HTMLElement, cell: Cell, tune: { event: string }) => void; cmd: string; event: string }, { listener: (button: HTMLElement, cell: Cell, tune: { event: string }) => void; cmd: string; event: string }, { listener: (button: HTMLElement, cell: Cell, tune: { event: string }) => void; cmd: string; event: string }] = [
      {
        cmd: "Run (Ctrl+Alt+M)",
        listener: shellListener,
        event: "shell.Run",
      },
      {
        cmd: "Stop (Ctrl+C)",
        listener: shellListener,
        event: "shell.Stop",
      },
      {
        cmd: "Clear",
        listener: () => this.clear(),
        event: "clear",
      }
    ];
    const wrapper = document.createElement('div');
    wrapper.classList.add('ce-popover__items');
    shellOptions.forEach(tune => {
      let button = document.createElement('div');
      button.classList.add('ce-popover__item');
      button.innerHTML = tune.cmd;
      wrapper.appendChild(button);
      button.addEventListener('click', () => {
        tune.listener(button, this, tune);
      });
    });
    return wrapper;
  }

  static get toolbox() {
    return {
      icon: EditorjsCodeflask.toolbox.icon,
      title: 'Code'
    };
  }
}
