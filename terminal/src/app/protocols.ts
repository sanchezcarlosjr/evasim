import {map, Observable, startWith, Subscriber, tap} from "rxjs";

import {
  IMqttMessage,
  MqttModule,
  IMqttServiceOptions, MqttService
} from 'ngx-mqtt';


export interface Protocol {
  connect: (options: any) => any;
}

export class WebRTC implements Protocol {
  bypass_parsing = true;
  private subscriber: Subscriber<any>| null = null;
  constructor() {
  }

  connect(options: { id: string }) {
    return new Observable((subscriber) => {
      subscriber.next({"state": "Starting connection"});
      //@ts-ignore
      startPeerConnection(this.generate_subscriber(subscriber)).join(options.id);
    });
  }

  complete() {
    this.subscriber?.complete();
  }

  send(message: object) {
  }

  private generate_subscriber(subscriber: Subscriber<any>) {
    this.subscriber = subscriber;
    return {
      assign_signal: (state: any) => {
        state.join2();
        subscriber.next({"state": "Assigning signal."});
      },
      connection_open: (state: any) => {
        this.send = state.send;
        subscriber.next({"state": "Successful connection!", ready: true, connection: this});
      },
      join_connection: () => {
        subscriber.next({"state": "Joining to peer."});
      },
      close: () => {
        subscriber?.complete();
      },
      receive: (state: any, message: object) => {
        subscriber?.next({"state": "new message from peer", ready: true, message, connection: this});
      },
      error: (state: any, error: any) => {
        subscriber?.error({"state": "error", error: error.message});
      },
      disconnected: () => {
        subscriber?.next({"state": `Disconnected!`});
      }
    };
  }
}

export class MQTT implements Protocol {
  bypass_parsing = true;
  private mqtt: MqttService | null = null;
  send(options: any) {
    this.mqtt?.unsafePublish(options.topic, options.message, options.options);
  }
  connect(options: IMqttServiceOptions & {topic: string}) {
    this.mqtt = new MqttService(options);
    return this.mqtt?.observe(options.topic).pipe(
      tap((message) => console.log(message)),
      startWith({
        ready: true,
        payload: "Successful connection!",
        connection: this
      }),
      map((message) => ({
        ready: true,
        message: message.payload.toString(),
        connection: this
      }))
    );
  }
}
