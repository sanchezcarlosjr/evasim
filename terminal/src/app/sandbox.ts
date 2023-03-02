import {Terminal} from 'xterm';
import {
  from,
  interval,
  map,
  startWith,
  generate,
  scan,
  of,
  reduce,
  delayWhen,
  tap,
  filter,
  take,
  catchError,
  switchMap,
  pipe, mergeWith, fromEvent, Observable, lastValueFrom, takeWhile
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {Peer} from "peerjs";
import "./peer";
import * as protocols from './protocols';


const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value) || value.bypass_parsing) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

enum Protocol {
  MQTT = "MQTT",
  WebRTC = "WebRTC"
}

export class Sandbox {
  constructor(private localEcho: any, private terminal: Terminal | undefined, private environment: any) {
    environment.tap = tap;
    environment.map = map;
    environment.reduce = reduce;
    environment.scan = scan;
    environment.generate = generate;
    environment.P = Protocol;
    environment.delayWhen = delayWhen;
    environment.switchMap = switchMap;
    environment.fromFetch = (input: string | Request) => fromFetch(input).pipe(
      switchMap((response: any) => response.ok ? response.json() : of({ error: true, message: `Error ${ response.status }` })),
      catchError(err => of({ error: true, message: err.message }))
    );
    environment.startWith = startWith;
    environment.randomBetween = (max = 0, min = 10) => Math.floor(Math.random() * (max - min + 1)) + min;
    environment.filter = filter;
    environment.of = of;
    environment.from = from;
    environment.interval = interval;
    environment.protocols =
    environment.take = take;
    environment.Peer = Peer;
    Object.defineProperty(environment, 'clear', {'get': () => of([true]).pipe(tap(_ => this.terminal?.clear()))});
    Object.defineProperty(environment, 'help', {
      'get': () => from([
        'clear - clears the terminal',
        `connect(protocol, options) - connects to some node using a protocol and its options. You could use ${Object.keys(Protocol).join(",")} protocols.`,
        'echo(message) - displays the message on the terminal',
        'fromFetch(input) - fetch some web api resource',
        'Learn more on https://carlos-eduardo-sanchez-torres.sanchezcarlosjr.com/Assisting-dementia-patients-with-the-Embodied-Voice-Assistant-Eva-Simulator-at-CICESE-9aade1ebef9948acafba73d834b19d0b'
      ])
        .pipe(tap(message => this.localEcho.println(message)))
    });
    environment.display = tap(observerOrNext => this.localEcho.println(JSON.stringify(observerOrNext, getCircularReplacer())));
    environment.echo = (msg: any) => of(msg).pipe(environment.display);
    const terminalDataObservable = new Observable((subscriber) => {
      const read_and_eval_loop = () => localEcho.read("You: ")
        .then((userInput: string) => {
          subscriber.next(userInput);
          read_and_eval_loop();
        })
        .catch((error: any) => {
          subscriber.error(error);
          return read_and_eval_loop();
        });
      read_and_eval_loop();
    });
    environment.chat = pipe(
      filter((configuration: any) => configuration.ready),
      switchMap(
        (configuration) =>
          terminalDataObservable.pipe(tap((userInput: any) => configuration.connection.send(userInput)
      )))
    );
    environment.send = (observable: Observable<any>) => pipe(
      filter((configuration: any) => configuration.ready),
      switchMap((configuration: any) => observable.pipe(tap(next => configuration.connection.send(next))))
    );
    // @ts-ignore
    environment.connect = (protocol, options: any) => protocols[protocol] ?
      // @ts-ignore
      (new protocols[protocol]()).connect(options).pipe(display) :
      of({ error: true, message: `Error: ${protocol} is not available.` });
  }

  spawn(action: string) {
    return new Function(`return ${action}`);
  }

  exec(action: string) {
    return this.spawn(action)();
  }
}
