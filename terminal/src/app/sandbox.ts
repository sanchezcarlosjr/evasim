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
  takeWhile,
  tap,
  timer, zip
} from 'rxjs';
import {fromFetch} from 'rxjs/fetch';
import {Peer} from "peerjs";
// @ts-ignore
import * as serialize from 'serialize-javascript';
import "./peer";
import * as protocols from './protocols';


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
    environment.deserialize = (code: string) => new Function(`return ${code}`)()
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
    environment.display = tap(observerOrNext => this.localEcho.println(serialize(observerOrNext)));
    environment.write = tap((observerOrNext: string) => this.terminal?.write(observerOrNext));
    environment.printWide = tap(observerOrNext => this.localEcho.printWide(observerOrNext));
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
      .catch((error: any) => {});
    return new Observable((subscriber: Subscriber<string>) => {
      read_and_eval_loop = read_and_eval_loop_generator(subscriber);
      read_and_eval_loop();
    }).pipe(
      switchMap((userInput: string) =>
        {
          try {
            if (!userInput) {
              read_and_eval_loop();
              return [];
            }
            let complete = false;
            this.terminal?.onData((x) => complete = x === "\x03");
            return this.exec(userInput).pipe(
              takeWhile(() => !complete),
              finalize(() => read_and_eval_loop())
            )
          } catch (e: any) {
            if (
              e instanceof SyntaxError ||
              e instanceof  ReferenceError ||
              e instanceof TypeError ||
              e instanceof RangeError ||
              e instanceof URIError
            ) {
              this.localEcho.println(`\x1b[31m${e.name}: ${e.message}\x1b[0m`);
              read_and_eval_loop();
              return [];
            }
            this.localEcho.println(`\x1b[31m${e.name}: ${e.message}\x1b[0m`);
            return [];
          }
        }
      )
    );
  }

  exec(action: string) {
    return this.spawn(action)();
  }
}
