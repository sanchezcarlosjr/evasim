import { DoWork, runWorker } from 'observable-webworker';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class HelloWorker implements DoWork<string, string> {
  public work(input$: Observable<string>): Observable<string> {
    return input$.pipe(
      map(message => {
        return `Hello from webworker`;
      }),
    );
  }
}

runWorker(HelloWorker);
