mergeInto(LibraryManager.library, {
  Init: function () {
    startPeerConnection({
        assign_signal: (state) => {
	    window.alert("ASSIGN SIGNAL");
	    const url = new URL(window.location);
	    url.searchParams.set('session', state.peer.id);
	    window.history.pushState({}, '', url);
	},
	peer_connection: () => {
	    window.alert("PEER CONNECTION");
	},
	receive: (state, message) => {
	    window.alert(message.message);
	},
	connection_open: () => {
	    window.alert("CONNECTION OPEN");
	},
	join_connection: () => {
	    window.alert("JOIN CONNECTION");
	},
	close: () => {
	     window.alert("CLOSE");
	},
	error: (state,error) => alert(error),
	disconnected: () => {
	     window.alert("DISCONNECT");
	}
    });
  }
});

