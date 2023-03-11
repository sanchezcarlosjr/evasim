import {from, MonoTypeOperatorFunction, Observable, switchMap, tap} from 'rxjs';
import {NgTerminal} from "ng-terminal";

export function save(query: string, expression: string) {
  const url = new URL(window.location.toString());
  url.searchParams.set(query, btoa(retrieve(query)+";"+expression));
  window.history.pushState({}, "", url);
  return expression;
}

export function retrieve(query: string, defaultValue="") {
  return atob((new URL(document.location.toString())).searchParams.get(query) || defaultValue);
}


export class Shell {
  private checkpointRecord: MonoTypeOperatorFunction<string> = tap((userInput: string) => {
    if (userInput) {
      save("checkpoint", userInput);
    }
  });
  constructor(private localEcho: any, private terminal: NgTerminal | undefined, private environment: any) {
    this.localEcho.println("Eva Terminal");
    this.localEcho.println(`Type "help" for all available commands. Eva Terminal supports JavaScript.`);
    const checkpoints = retrieve("checkpoint").split(";");
    checkpoints.forEach(checkpoint => localEcho.history.push(checkpoint));
    environment.addEventListener('terminal.clear', () => this.terminal?.underlying.clear());
    environment.addEventListener('speak', (event: CustomEvent) =>  window.speechSynthesis.speak(new SpeechSynthesisUtterance(event.detail.payload.toString())));
    environment.addEventListener('localecho.println', (event: CustomEvent) => this.localEcho.println(event.detail.payload));
    environment.addEventListener('localecho.printWide', (event: CustomEvent) => this.localEcho.printWide(event.detail.payload));
    environment.addEventListener('prompt', (event: CustomEvent) => event.detail.port.postMessage({event: 'prompt', payload: prompt(event.detail.payload)}));
    environment.addEventListener('localStorage.getItem', (event: CustomEvent) => event.detail.port.postMessage({event: 'localStorage.getItem', payload: localStorage.getItem(event.detail.payload.key)}));
    environment.addEventListener('localStorage.setItem', (event: CustomEvent) => localStorage.setItem(event.detail.payload.key, event.detail.payload.value));
    environment.addEventListener('localStorage.removeItem', (event: CustomEvent) => localStorage.removeItem(event.detail.payload.key));
  }

  fork(userInput: string) {
    return new Observable((subscriber) => {
      const worker = new Worker(new URL('./process.worker', import.meta.url), {type: 'module'});
      worker.onmessage = (event) =>
        this.environment.dispatchEvent(new CustomEvent(event.data.event, {
          bubbles: true,
          detail: {
            port: worker,
            payload: event.data.payload
          }
        }));
      worker.onerror = (event) => {
        this.localEcho.println(`\x1b[31m ${event.message}\x1b[0m`);
        this.environment.dispatchEvent(new CustomEvent('complete', {bubbles: true}));
      };
      worker.postMessage({event: 'exec', payload: userInput});
      const subscription = this.terminal?.onData().subscribe((observer) => {
        if (observer === "\x03") {
          this.environment.dispatchEvent(new CustomEvent('complete', {bubbles: true}));
        }
      });
      this.environment.addEventListener('complete', () => {
        subscription?.unsubscribe();
        worker.terminate();
        subscriber.complete();
      });
    });
  }

  start() {
    this.repl().pipe(
      this.checkpointRecord,
      switchMap(userInput => this.fork(userInput))).subscribe({
      complete: () => this.next()
    });
    const lastValue = this.localEcho.history.entries[Math.max(0,this.localEcho.history.cursor-1)];
    if (lastValue) {
      this.localEcho.setInput(lastValue);
      this.localEcho.setCursor(lastValue.length);
    }
  }

  next() {
    const generateQueries = () => this.repl().pipe(
      this.checkpointRecord,
      switchMap(userInput => this.fork(userInput))).subscribe({
      complete: generateQueries
    });
    generateQueries();
  }

  generateNewREPL() {
    const generateQueries = () => this.repl().pipe(
      switchMap(userInput => this.fork(userInput))).subscribe({
      complete: generateQueries
    });
    generateQueries();
  }


  repl(prompt = "$ "): Observable<string> {
    return from(this.localEcho.read(prompt)) as Observable<string>;
  }

}
