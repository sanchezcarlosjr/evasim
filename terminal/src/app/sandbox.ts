import {Terminal} from 'xterm';
import {from, interval, Observable, of, Subject, Subscriber, tap, map, reduce} from 'rxjs';
import {Peer} from "peerjs";
import "./peer";
// @ts-ignore
window.tap = tap;
// @ts-ignore
window.map = map;
// @ts-ignore
window.reduce = reduce;
//@ts-ignore
window.Peer = Peer;

class PeerSubscriber {
  private subscriber: any;

  constructor() {
  }

  private _connection$: null | Subject<any> = null;

  get connection$() {
    return this._connection$;
  }

  join(uid: string) {
    return new Observable((subscriber) => {
      subscriber.next({"state": "Starting connection"});
      //@ts-ignore
      startPeerConnection(this.generate_subscriber(subscriber)).join(uid);
    });
  }

  send(message: object) {
  }

  private generate_subscriber(subscriber: Subscriber<any>) {
    this._connection$ = new Subject();
    this.subscriber = {
      assign_signal: (state: any) => {
        state.join2();
        subscriber.next({"state": "Assigning signal."});
      },
      connection_open: (state: any) => {
        subscriber.next({"state": "Successful connection!"});
        this.send = state.send;
        subscriber.complete();
      },
      join_connection: () => {
        subscriber.next({"state": "Joining to peer."});
      },
      close: () => {
        (subscriber.closed ? this._connection$ : subscriber)?.complete();
      },
      receive: (state: any, message: object) => {
        this._connection$?.next(message);
      },
      error: (state: any, error: any) => {
        (subscriber.closed ? this._connection$ : subscriber)?.error(error);
      },
      disconnected: () => {
        (subscriber.closed ? this._connection$ : subscriber)?.next({"state": `Disconnected!`});
      }
    };
    return this.subscriber;
  }
}


export class Sandbox {
  private peerSubscriber: null | PeerSubscriber;

  constructor(private localEcho: any, private terminal: Terminal | undefined) {
    this.peerSubscriber = null;
  }

  clear() {
    return of([]).pipe(tap(_ => this.terminal?.clear()));
  }

  connect(uid: string) {
    this.peerSubscriber = new PeerSubscriber();
    return this.peerSubscriber.join(uid).pipe(tap((configuration: any) => this.localEcho.println(configuration.state)));
  }

  echo(message: string) {
    if (!this.peerSubscriber)
      throw new Error("Error in connection");
    this.peerSubscriber.send({message});
    return of(message).pipe(tap(uid => this.localEcho.println(message)));
  }

  interval$(period: number) {
    return interval(period);
  }

  help() {
    return from([
      'clear() - clears the terminal',
      'connect(uid) - connects to EVA',
      'echo(message) - send a message to EVA',
      'debug() - connects to current eva'
    ])
      .pipe(tap(message => this.localEcho.println(message)));
  }

  spawn(action: string) {
    // @ts-ignore
    return new Function(`return this.${action}`).bind(this);
  }

  exec(action: string) {
    return this.spawn(action)();
  }
}
