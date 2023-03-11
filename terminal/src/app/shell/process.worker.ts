const window = self;

import * as rx from "rxjs";
import {catchError, filter, from, interval, map, of, range, reduce, scan, switchMap, take, tap, throwError} from "rxjs";
import {fromFetch} from "rxjs/fetch";
import * as jp from 'jsonpath';

function sendMessage(message: any) {
  self.postMessage(message);
}

class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestError";
  }
}

// @ts-ignore
globalThis.database = {
  retrieve: (key: string) => new Promise((resolve, reject) => {
    // @ts-ignore
    globalThis.addEventListener('localStorage.getItem', (event: CustomEvent) => {
      resolve(event.detail.payload);
      // @ts-ignore
      globalThis.removeEventListener('localStorage.getItem', null);
    });
    sendMessage({event: 'localStorage.getItem', payload: {key}});
  }),
  save: (key: string, value: string) => new Promise((resolve, reject) => {
    resolve(value);
    if (!value)
      return null;
    sendMessage({event: 'localStorage.setItem', payload: {key, value}});
    return value;
  }),
  removeItem: (key: string) => new Promise((resolve, reject) => {
    resolve(key);
    if (!key)
      return null;
    sendMessage({event: 'localStorage.removeItem', payload: {key}});
    return key;
  })
}

function prompt(text: string) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    globalThis.addEventListener('prompt', (event: CustomEvent) => {
      resolve(event.detail.payload);
      // @ts-ignore
      globalThis.removeEventListener('prompt', null);
    });
    // @ts-ignore
    sendMessage({event: 'prompt', payload: text});
  });
}

const speechSynthesis = {
  speak: (text: string) => {
    // @ts-ignore
    sendMessage({event: 'speak', payload: text});
  }
}

//@ts-ignore
globalThis.throwError = (error: Error) => {
  throw error;
}

async function generateChatGPTRequest(content: string) {
  // @ts-ignore
  const token = await globalThis.database.retrieve("token-OpenIA") ?? await globalThis.database.save("token-OpenIA", await prompt("Write your OpenAI Token. We save tokens on your local storage as token-OpenIA."));
  if (!token) {
    //@ts-ignore
    globalThis.throwError(new ReferenceError('token-OpenIA is not defined. You have got to save a token for the Open IA API REST. Check out https://openai.com/product.'));
  }
  return new Request('https://api.openai.com/v1/chat/completions',
    {
      'method': 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }, "body": JSON.stringify({
        "model": "gpt-3.5-turbo",
        "messages": [
          {
            "role": "user",
            "content": content
          }
        ]
      })
    });
}

class Terminal {
  clear() {
    // @ts-ignore
    sendMessage({event: 'terminal.clear'});
  }

  write(observerOrNext: string) {
    // @ts-ignore
    sendMessage({event: 'terminal.write', payload: observerOrNext});
  }
}

class LocalEcho {
  println(message: string) {
    // @ts-ignore
    sendMessage({event: 'localecho.println', payload: message});
  }

  printWide(message: string[] | any) {
    // @ts-ignore
    sendMessage({event: 'localecho.printWide', payload: message});
  }
}

class ProcessWorker {
  constructor(private environment: any, private localEcho: LocalEcho, private terminal: Terminal) {
    Object.defineProperty(environment, 'clear', {'get': () => of([true]).pipe(tap(_ => this.terminal.clear()))});
    Object.defineProperty(environment, 'help', {
      'get': () => from([
        'clear - clears the terminal',
        `connect(protocol, options) - connects to some node using a protocol and its options.`,
        'echo(message) - displays the message on the terminal',
        'fromFetch(input) - fetch some web api resource',
        'Learn more on https://carlos-eduardo-sanchez-torres.sanchezcarlosjr.com/Assisting-dementia-patients-with-the-Embodied-Voice-Assistant-Eva-Simulator-at-CICESE-9aade1ebef9948acafba73d834b19d0b#0a45eb21f25a4551ba920e35165dce1e'
      ])
        .pipe(tap(message => this.localEcho.println(message)))
    });
    environment.tap = tap;
    environment.map = map;
    environment.reduce = reduce;
    environment.scan = scan;
    environment.filter = filter;
    environment.range = range;
    environment.serialize = (obj: any) => JSON.stringify(obj);
    environment.deserialize = (code: string) => JSON.parse(code);
    environment.from = from;
    environment.of = of;
    environment.interval = interval;
    environment.speak = tap((text: string) => speechSynthesis.speak(text));
    environment.take = take;
    environment.switchMap = switchMap;
    environment.rx = rx;
    environment.display = (f = (x: any) => x) => tap(observerOrNext => this.localEcho.println(environment.serialize(f(observerOrNext)).replace(/\\u002F/g, "/")));
    environment.randomBetween = (max = 0, min = 10) => Math.floor(Math.random() * (max - min + 1)) + min;
    environment.fromFetch = (input: string | Request) => fromFetch(input).pipe(
      switchMap((response: any) => response.ok ? response.json() :
        of({error: true, message: `The HTTP status is ${response.status}. For more information consult https://developer.mozilla.org/en-US/docs/Web/HTTP/Status.`})
      ),
      catchError(err => of({error: true, message: err.message}))
    );
    environment.jp = jp;
    environment.jpquery = (path: string) => map((ob: object) => jp.query(ob, path));
    environment.jpapply = (path: string, fn: (x: any) => any) => map((ob: object) => jp.apply(ob, path, fn));
    environment.write = tap((observerOrNext: string) => this.terminal?.write(observerOrNext));
    environment.printWide =
      tap(observerOrNext => this.localEcho.printWide(Array.isArray(observerOrNext) ? observerOrNext : environment.throwError(new Error(`TypeError: The operator printWide only supports iterators. ${observerOrNext} has to be an iterator.`))));
    environment.echo = (msg: any) => of(msg).pipe(filter(x => !!x), environment.display());
    environment.publishMQTT =
      (topic: string, options = {publication: {}, message: {}}) =>
        map((text: string) => ({topic, message: environment.serialize({text, ...options.message}), ...options.publication}));
    environment.sayHermes = environment.publishMQTT("hermes/tts/say");
    environment.gpt = switchMap((message: string) =>
      from(generateChatGPTRequest(message)).pipe(switchMap(request => environment.fromFetch(request)
        .pipe(
          tap(next => console.log("ChatGPT Fetch", JSON.stringify(next))),
          tap((x: {error: boolean}) => {
            if (x.error) {
              // @ts-ignore
              globalThis.database.removeItem("token-OpenIA");
              // @ts-ignore
              globalThis.throwError(new RequestError(`${x.message}`));
            }
          }),
          filter((x: any) => !x.error),
          map((response: any) => response.choices[environment.randomBetween(response.choices.length - 1, 0)].message.content)
        )))
    );
    // @ts-ignore
    environment.connect = (protocol: string, options: any) => protocols[protocol] ?
      // @ts-ignore
      (new protocols[protocol]()).connect(options).pipe(tap(next => console.log(`Connect ${protocol}`, next))) :
      of({error: true, message: `Error: ${protocol} is not available.`})
  }

  spawn(action: string) {
    return new Function(`return ${action}`);
  }

  exec(action: string) {
    return this.spawn(action)();
  }
}

const processWorker = new ProcessWorker(globalThis, new LocalEcho(),  new Terminal());

// @ts-ignore
globalThis.addEventListener('exec', (event: CustomEvent) => {
  if (!event.detail.payload) {
    sendMessage({'event': 'complete'});
    return;
  }
  processWorker.exec(event.detail.payload).subscribe({
    // @ts-ignore
    complete: () => sendMessage({'event': 'complete'})
  });
});


self.onmessage = (event) => globalThis.dispatchEvent(new CustomEvent(event.data.event, {
  bubbles: true,
  detail: {
    payload: event.data.payload
  }
}))
