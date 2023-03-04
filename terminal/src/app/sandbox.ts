import {Terminal} from 'xterm';
import {
  catchError,
  delayWhen,
  filter,
  finalize,
  from,
  generate,
  interval,
  map,
  Observable,
  of,
  pipe,
  range,
  reduce,
  scan,
  startWith,
  Subscriber,
  switchMap,
  take,
  tap,
  throwError, timer, zip
} from 'rxjs';
import {fromFetch} from 'rxjs/fetch';
import {Peer} from "peerjs";
// @ts-ignore
import * as serialize from 'serialize-javascript';
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
    environment.ChatGPT = (token: string) => (content: string) =>
      new Request('https://api.openai.com/v1/chat/completions',
        {
          'method': 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, "body": JSON.stringify({
            "model": "gpt-3.5-turbo",
            "messages": [
              {
                "role": "user",
                "content": content
              }
            ]
          })
        });
    environment.delayWhen = delayWhen;
    environment.switchMap = switchMap;
    environment.s = (f: (environment: any) => any) => of(f(environment));
    environment.fromFetch = (input: string | Request) => fromFetch(input).pipe(
      switchMap((response: any) => response.ok ? response.json() :
        of({error: true, message: `Error ${response.status}`})
      ),
      catchError(err => of({error: true, message: err.message}))
    );
    environment.startWith = startWith;
    environment.randomBetween = (max = 0, min = 10) => Math.floor(Math.random() * (max - min + 1)) + min;
    environment.filter = filter;
    environment.range = range;
    environment.of = of;
    environment.serialize = serialize;
    environment.from = from;
    environment.interval = interval;
    environment.take = take;
    environment.zip = zip;
    environment.timer = timer;
    environment.pipe = pipe;
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
    environment.echo = (msg: any) => of(msg).pipe(filter((x) => !!x), environment.display);
    environment.chat = (observable: any = this.repl("You: ")) => pipe(
      filter((configuration: any) => configuration.ready),
      switchMap((configuration: any) =>
        (typeof observable === "function" ? observable(configuration.message) : observable).pipe(tap(next => configuration.connection.send(next))))
    );
    environment.repl = this.repl;
    environment.gpt = (message: string) => environment.echo(message).pipe(
      switchMap(() =>
        environment.fromFetch(environment.ChatGPT(message))
          .pipe(
            environment.display,
            map((response: any) => response.choices[environment.randomBetween(response.choices.length - 1, 0)].message.content)
          )
      )
    );
    // @ts-ignore
    environment.connect = (protocol: string, options: any) => protocols[protocol] ?
      // @ts-ignore
      (new protocols[protocol]()).connect(options) :
      of({error: true, message: `Error: ${protocol} is not available.`})
  }

  spawn(action: string) {
    return new Function(`return ${action}`);
  }

  repl(prompt = "$ ") {
    let read_and_eval_loop = () => {
    };
    let read_and_eval_loop_generator = (subscriber: Subscriber<string>) => () => this.localEcho.read(prompt)
      .then((userInput: string) => subscriber.next(userInput))
      .catch((error: any) => {
        this.localEcho.println(`ERROR: ${error}`);
        subscriber.error(error);
        return read_and_eval_loop();
      });
    return new Observable((subscriber: Subscriber<string>) => {
      read_and_eval_loop = read_and_eval_loop_generator(subscriber);
      read_and_eval_loop();
    }).pipe(switchMap((userInput: string) => this.exec(userInput).pipe(finalize(() => read_and_eval_loop()))));
  }

  exec(action: string) {
    return this.spawn(action)();
  }
}
