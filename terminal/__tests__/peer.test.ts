import { assert, describe, vi, expect, it, expectTypeOf } from 'vitest'
import {startPeerConnection} from "../src/peer";

const peers = [];
class Peer {
   id = "";
   methods = {};
   constructor() {
	   peers.push(this);
   }
   on(name: string, method: () => void) {
	   this.methods[name] = method;
   }
   fake(name: string) {
	   this.methods[name](this.id);
   }
};


vi.stubGlobal('Peer', Peer);


describe('peerjs', () => {
	it('startPeerConnection', () => {
		const subscriber = {
			state: null,
			open: (state) => {
				subscriber.state = state;
			}
		};
		peers[0].fake('open');
		expectTypeOf(subscriber.state.send).toBeFunction();
	});
})
