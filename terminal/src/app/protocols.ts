import {map, Observable, Subscriber, tap} from "rxjs";

import {IMqttServiceOptions, MqttService} from 'ngx-mqtt';


export interface Protocol {
  connect: (options: any) => any;
}

export class WebRTC implements Protocol {
  private subscriber: Subscriber<any> | null = null;
  private state: any = null;

  constructor() {
  }

  connect(options?: { id: string }) {
    return new Observable((subscriber) => {
      //@ts-ignore
      this.state = startPeerConnection(this.generate_subscriber(subscriber, options));
      this.join(options);
    });
  }

  complete() {
    this.state.destroy();
    this.subscriber?.complete();
  }

  join(options?: { id: string }) {
    if (options && options.id) {
      this.state?.join(options.id);
    }
  }

  send(message: string) {
  }

  toJSON() {
    return undefined;
  }

  private generate_subscriber(subscriber: Subscriber<any>, options?: {id: string}) {
    this.subscriber = subscriber;
    return {
      assign_signal: (state: any) => {
        subscriber.next({"state": `Signal assignation successful!`, "id": `${state.peer.id}`, connection: this});
        if (options && options.id) {
          state.join2();
        }
      },
      peer_connection: (state: any) => {
        this.send = state.send;
        subscriber.next({"state": `Successful connection!`, ready: true, connection: this});
      },
      connection_open: (state: any) => {
        this.send = state.send;
        subscriber.next({"state": `Successful connection!`, ready: true, connection: this});
      },
      join_connection: () => {
      },
      close: () => {
        subscriber?.next({"state": "Your peer have closed the connection", ready: false});
        subscriber?.complete();
      },
      receive: (state: any, message: object) => {
        subscriber?.next({"state": "New message from peer", ready: true, message, connection: this});
      },
      error: (state: any, error: any) => {
        subscriber?.error({"state": "Error", ready: true, error: error.message});
      },
      disconnected: () => {
        subscriber?.next({"state": `Disconnected!`, ready: true});
      }
    };
  }
}

export class MQTT implements Protocol {
  private mqtt: MqttService | null = null;

  send(options: any) {
    this.mqtt?.unsafePublish(options.topic, options.message, options.options);
  }

  toJSON() {
    return undefined;
  }

  connect(options: IMqttServiceOptions & { topic: string }) {
    this.mqtt = new MqttService({
      protocol: document.location.protocol == "https:" ? "wss" : "ws",
      ...options,
    });
    return this.mqtt?.observe(options.topic).pipe(
      tap((message) => console.log(message)),
      map((message) => ({
        ready: true,
        message: message.payload.toString(),
        connection: this
      }))
    );
  }
}
