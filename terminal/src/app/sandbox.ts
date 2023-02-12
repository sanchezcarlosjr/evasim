import { Terminal } from 'xterm';
import {delay, from, interval, Observable, of, Subject, Subscription, tap} from 'rxjs';

export class Sandbox {
  constructor(private localEcho: any, private terminal: Terminal | undefined) {
  }
  clear() {
    return of([]).pipe(tap(_ => this.terminal?.clear()));
  }
  connect(uid: string) {
    return of(uid).pipe(tap(abc => this.localEcho.println(`connecting ${abc}`)));
  }
  echo(message: string) {
    return of(message).pipe(tap(uid => this.localEcho.println(message)));
  }
  interval$(period: number) {
     return interval(period);
  }
  help() {
    return from([
      'clear - clears the terminal',
      'connect(uid)',
      'echo(message) - display your message',
      'debug - connects to current eva'
    ])
      .pipe(tap(message => this.localEcho.println(message)));
  }
  spawn(action: string) {
    // @ts-ignore
    return new Function(`return () => this.${action}.length === 0 ? this.${action}() : this.${action}`).bind(this);
  }
  exec(action: string) {
    return (this.spawn(action)()()).subscribe().unsubscribe();
  }
}
